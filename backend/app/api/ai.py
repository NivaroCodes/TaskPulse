from fastapi import APIRouter, Depends

from app.core.auth import get_current_user, AuthUser
from app.schemas.ai import (
    GenerateSubtasksRequest,
    GenerateSubtasksResponse,
    ImproveTextRequest,
    ImproveTextResponse,
)
from app.services import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/generate-subtasks", response_model=GenerateSubtasksResponse)
async def generate_subtasks(
    request: GenerateSubtasksRequest,
    user: AuthUser = Depends(get_current_user)
):
    subtasks = await ai_service.generate_subtasks(
        title=request.title,
        description=request.description
    )
    return GenerateSubtasksResponse(subtasks=subtasks)


@router.post("/improve-text", response_model=ImproveTextResponse)
async def improve_text(
    request: ImproveTextRequest,
    user: AuthUser = Depends(get_current_user)
):
    improved_text = await ai_service.improve_text(request.text)
    return ImproveTextResponse(improved_text=improved_text)