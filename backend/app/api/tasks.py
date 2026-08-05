from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.core.auth import AuthUser, require_view, require_delete, require_edit, require_create
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.schemas.subtask import SubtaskCreate, SubtaskUpdate, SubtaskResponse
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.activity_log import ActivityLogResponse
from app.repositories.task_repository import TaskRepository
from app.services.task_service import TaskService
from app.services.subscription_service import SubscriptionService
from app.api.websockets import manager

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

async def get_task_repository(db: AsyncSession = Depends(get_db)) -> TaskRepository:
    return TaskRepository(db)

async def get_task_service(repo: TaskRepository = Depends(get_task_repository), db: AsyncSession = Depends(get_db)) -> TaskService:
    subscription_service = SubscriptionService(db)
    return TaskService(repo, subscription_service)

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
    task = await task_service.create_task(task_data=task_data, user_id=user.user_id, org_id=user.org_id)
    if task.assignee and task.assignee != user.user_id:
        await manager.send_personal_message({
            "type": "TASK_ASSIGNED",
            "task_id": task.id,
            "task_title": task.title,
            "assigner_id": user.user_id
        }, task.assignee)
        
    await manager.broadcast_to_org({
        "type": "TASK_CREATED",
        "task": TaskResponse.model_validate(task).model_dump(mode="json"),
        "sender_id": user.user_id
    }, user.org_id)
    return task

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
    old_task = await task_service.get_task_by_id(task_id=task_id, org_id=user.org_id)
    
    updated_task = await task_service.update_task(task_id=task_id, task_data=task_data, user_id=user.user_id, org_id=user.org_id)
    
    if updated_task.assignee and updated_task.assignee != old_task.assignee and updated_task.assignee != user.user_id:
        await manager.send_personal_message({
            "type": "TASK_ASSIGNED",
            "task_id": updated_task.id,
            "task_title": updated_task.title,
            "assigner_id": user.user_id
        }, updated_task.assignee)
        
    await manager.broadcast_to_org({
        "type": "TASK_UPDATED",
        "task": TaskResponse.model_validate(updated_task).model_dump(mode="json"),
        "sender_id": user.user_id
    }, user.org_id)
    return updated_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
        task_id: str,
        user: AuthUser = Depends(require_edit),
        task_service: TaskService = Depends(get_task_service)
):
    await task_service.delete_task(task_id, user.user_id, user.org_id)
    await manager.broadcast_to_org({
        "type": "TASK_DELETED",
        "task_id": task_id,
        "sender_id": user.user_id
    }, user.org_id)
    return None

@router.post("/{task_id}/subtasks", response_model=SubtaskResponse)
async def create_subtask(
        task_id: str,
        subtask_data: SubtaskCreate,
        user: AuthUser = Depends(require_edit),
        task_service: TaskService = Depends(get_task_service)
):
    subtask = await task_service.create_subtask(task_id, subtask_data, user.user_id, user.org_id)
    await manager.broadcast_to_org({"type": "BOARD_UPDATED"}, user.org_id)
    return subtask

@router.put("/{task_id}/subtasks/{subtask_id}", response_model=SubtaskResponse)
async def update_subtask(
        task_id: str,
        subtask_id: str,
        subtask_data: SubtaskUpdate,
        user: AuthUser = Depends(require_view),
        task_service: TaskService = Depends(get_task_service)
):
    subtask = await task_service.update_subtask(task_id, subtask_id, subtask_data, user.user_id, user.org_id)
    await manager.broadcast_to_org({"type": "BOARD_UPDATED"}, user.org_id)
    return subtask

@router.delete("/{task_id}/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtask(
        task_id: str,
        subtask_id: str,
        user: AuthUser = Depends(require_edit),
        task_service: TaskService = Depends(get_task_service)
):
    await task_service.delete_subtask(task_id, subtask_id, user.user_id, user.org_id)
    await manager.broadcast_to_org({"type": "BOARD_UPDATED"}, user.org_id)
    return None

@router.post("/{task_id}/comments", response_model=CommentResponse)
async def create_comment(
        task_id: str,
        comment_data: CommentCreate,
        user: AuthUser = Depends(require_view),
        task_service: TaskService = Depends(get_task_service)
):
    comment = await task_service.create_comment(task_id, comment_data, user.user_id, user.org_id)
    await manager.broadcast_to_org({"type": "BOARD_UPDATED"}, user.org_id)
    return comment

@router.get("/{task_id}/activity", response_model=List[ActivityLogResponse])
async def get_task_activity(
        task_id: str,
        user: AuthUser = Depends(require_view),
        task_service: TaskService = Depends(get_task_service)
):
    return await task_service.get_task_activity(task_id, user.org_id)