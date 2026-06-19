from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import tasks


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Task Board API",
    desctiption="B2B Task Board App",
    version="1.0.0",
)

print(f"DEBUG: settings.FRONTEND_URL is: {settings.FRONTEND_URL}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(tasks.router)