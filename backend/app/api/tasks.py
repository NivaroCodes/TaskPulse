from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.core.auth import AuthUser, require_view, require_delete, require_edit, require_create
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.repositories.task_repository import TaskRepository
from fastapi import Depends

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

async def get_task_repository(db: AsyncSession = Depends(get_db)):

    return TaskRepository(db)


@router.get("", response_model=List[TaskResponse])
async def list_tasks(user: AuthUser = Depends(require_view), repo: TaskRepository = Depends(get_task_repository)):
    return await repo.get_all(org_id=user.org_id)

@router.post("", response_model=TaskResponse)
async def create_task(
        task_data: TaskCreate,
        user: AuthUser = Depends(require_create),
        db: AsyncSession = Depends(get_db)
):
    repo = TaskRepository(db)
    return await repo.create(task_data=task_data, user_id=user.user_id, org_id=user.org_id)

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
        task_id: str,
        user: AuthUser = Depends(require_view),
        db: AsyncSession = Depends(get_db)
):
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id=task_id, org_id=user.org_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
        task_id: str,
        task_data: TaskUpdate,
        user: AuthUser = Depends(require_edit),
        db: AsyncSession = Depends(get_db)
):
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id=task_id, org_id=user.org_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    return await repo.update(task=task, task_data=task_data)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
        task_id: str,
        user: AuthUser = Depends(require_delete),
        db: AsyncSession = Depends(get_db)
):
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id=task_id, org_id=user.org_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    await repo.delete(task)
    return None