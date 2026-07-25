from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.core.auth import AuthUser, require_view, require_delete, require_edit, require_create
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.repositories.task_repository import TaskRepository
from app.services.task_service import TaskService

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

async def get_task_repository(db: AsyncSession = Depends(get_db)) -> TaskRepository:
    return TaskRepository(db)

async def get_task_service(repo: TaskRepository = Depends(get_task_repository)) -> TaskService:
    return TaskService(repo)

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    user: AuthUser = Depends(require_view),
    task_service: TaskService = Depends(get_task_service)
):
    return await task_service.get_all_tasks(org_id=user.org_id)

@router.post("", response_model=TaskResponse)
async def create_task(
        task_data: TaskCreate,
        user: AuthUser = Depends(require_create),
        task_service: TaskService = Depends(get_task_service)
):
    return await task_service.create_task(task_data=task_data, user_id=user.user_id, org_id=user.org_id)

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
        task_id: str,
        user: AuthUser = Depends(require_view),
        task_service: TaskService = Depends(get_task_service)
):
    return await task_service.get_task_by_id(task_id=task_id, org_id=user.org_id)

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
        task_id: str,
        task_data: TaskUpdate,
        user: AuthUser = Depends(require_edit),
        task_service: TaskService = Depends(get_task_service)
):
    return await task_service.update_task(task_id=task_id, task_data=task_data, org_id=user.org_id)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
        task_id: str,
        user: AuthUser = Depends(require_delete),
        task_service: TaskService = Depends(get_task_service)
):
    await task_service.delete_task(task_id=task_id, org_id=user.org_id)
    return None