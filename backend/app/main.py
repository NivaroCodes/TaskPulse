import sys
import asyncio
from contextlib import asynccontextmanager

import uuid
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import tasks, webhooks, invitations, organizations, payments, analytics, websockets, ai

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

print(f"DEBUG: settings.FRONTEND_URL is: {settings.FRONTEND_URL}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="Task Board API",
    description="B2B Task Board App",
    version="1.0.0",
    lifespan=lifespan
)

@app.middleware("http")
async def id_generator_middleware(request: Request, call_next):
    request.state.request_id = uuid.uuid4().hex
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:8080", "http://localhost:8080/", "http://127.0.0.1:8080", "http://127.0.0.1:8080/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(tasks.router)
app.include_router(webhooks.router)
app.include_router(invitations.router)
app.include_router(organizations.router)
app.include_router(payments.router)
app.include_router(analytics.router)
app.include_router(websockets.router)
app.include_router(ai.router)