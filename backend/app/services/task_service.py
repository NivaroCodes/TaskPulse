from typing import List
from fastapi import HTTPException, status
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate
from app.repositories.task_repository import TaskRepository
from app.core.config import settings

class TaskService:
    def __init__(self, task_repository: TaskRepository):
        self.task_repository = task_repository

    async def get_all_tasks(self, org_id: str) -> List[Task]:
        return await self.task_repository.get_all(org_id)

    async def get_task_by_id(self, task_id: str, org_id: str) -> Task:
        task = await self.task_repository.get_by_id(task_id, org_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return task

    async def create_task(self, task_data: TaskCreate, user_id: str, org_id: str) -> Task:
        current_tasks = await self.task_repository.get_all(org_id)
        
        if org_id == "org_3FLM8kIpzOCdKJohQvbfB2nf8OJ" and len(current_tasks) >= settings.FREE_TIER_MEMBERSHIP_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Free tier organizations are limited to {settings.FREE_TIER_MEMBERSHIP_LIMIT} tasks."
            )

        return await self.task_repository.create(task_data, user_id, org_id)

    async def update_task(self, task_id: str, task_data: TaskUpdate, org_id: str) -> Task:
        task = await self.task_repository.get_by_id(task_id, org_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
        return await self.task_repository.update(task, task_data)

    async def delete_task(self, task_id: str, org_id: str) -> None:
        task = await self.task_repository.get_by_id(task_id, org_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
        await self.task_repository.delete(task)