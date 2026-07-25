from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, task_id: str, org_id: str) -> Task | None:
        result = await self.db.execute(select(Task).filter_by(id=task_id, org_id=org_id))
        return result.scalars().first()

    async def get_all(self, org_id: str) -> List[Task]:
        result = await self.db.execute(select(Task).filter_by(org_id=org_id))
        return list(result.scalars().all())

    async def create(self, task_data: TaskCreate, user_id: str, org_id: str) -> Task:
        new_task = Task(
            title=task_data.title,
            description=task_data.description,
            status=task_data.status,
            priority=task_data.priority,
            assignee=task_data.assignee,
            org_id=org_id,
            created_by=user_id
        )
        self.db.add(new_task)
        await self.db.commit()
        await self.db.refresh(new_task)
        return new_task

    async def update(self, task: Task, task_data: TaskUpdate) -> Task:
        update_data = task_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
        
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def delete(self, task: Task) -> None:
        await self.db.delete(task)
        await self.db.commit()