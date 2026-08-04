from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, task_id: str, org_id: str) -> Task | None:
        stmt = select(Task).filter_by(id=task_id, org_id=org_id).options(
            selectinload(Task.subtasks),
            selectinload(Task.comments)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_all(self, org_id: str) -> List[Task]:
        stmt = select(Task).filter_by(org_id=org_id).options(
            selectinload(Task.subtasks),
            selectinload(Task.comments)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, task_data: TaskCreate, user_id: str, org_id: str) -> Task:
        new_task = Task(
            title=task_data.title,
            description=task_data.description,
            status=task_data.status,
            priority=task_data.priority,
            assignee=task_data.assignee,
            due_date=task_data.due_date,
            org_id=org_id,
            created_by=user_id
        )
        self.db.add(new_task)
        await self.db.commit()
        return await self.get_by_id(new_task.id, org_id)

    async def update(self, task: Task, task_data: TaskUpdate) -> Task:
        update_data = task_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
        
        await self.db.commit()
        return await self.get_by_id(task.id, task.org_id)

    async def delete(self, task: Task) -> None:
        await self.db.delete(task)
        await self.db.commit()