from typing import List
from fastapi import HTTPException, status
from app.models.task import Task
from app.models.subtask import Subtask
from app.models.comment import Comment
from app.models.activity_log import ActivityLog
from app.schemas.task import TaskCreate, TaskUpdate
from app.schemas.subtask import SubtaskCreate, SubtaskUpdate
from app.schemas.comment import CommentCreate
from app.repositories.task_repository import TaskRepository
from app.services.subscription_service import SubscriptionService
from app.core.config import settings

class TaskService:
    def __init__(self, task_repository: TaskRepository, subscription_service: SubscriptionService):
        self.task_repository = task_repository
        self.subscription_service = subscription_service

    async def _log_activity(self, task_id: str, user_id: str, org_id: str, action: str, details: str = None):
        log = ActivityLog(task_id=task_id, user_id=user_id, org_id=org_id, action=action, details=details)
        self.task_repository.db.add(log)
        await self.task_repository.db.commit()

    async def get_all_tasks(self, org_id: str) -> List[Task]:
        return await self.task_repository.get_all(org_id)

    async def get_task_by_id(self, task_id: str, org_id: str) -> Task:
        task = await self.task_repository.get_by_id(task_id, org_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return task

    async def create_task(self, task_data: TaskCreate, user_id: str, org_id: str) -> Task:
        if task_data.status:
            await self.subscription_service.check_task_status_allowed(org_id, task_data.status)
            
        task = await self.task_repository.create(task_data, user_id, org_id)
        await self._log_activity(task.id, user_id, org_id, "Created task", f"Title: {task.title}")
        return task

    async def update_task(self, task_id: str, task_data: TaskUpdate, user_id: str, org_id: str) -> Task:
        task = await self.task_repository.get_by_id(task_id, org_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
            
        if task_data.status and task_data.status != task.status:
            await self.subscription_service.check_task_status_allowed(org_id, task_data.status)
        
        changes = []
        if task_data.title and task_data.title != task.title:
            changes.append(f"Title changed to '{task_data.title}'")
        if task_data.status and task_data.status != task.status:
            changes.append(f"Status changed to '{task_data.status}'")
        if task_data.assignee is not None and task_data.assignee != task.assignee:
            changes.append(f"Assigned to {task_data.assignee}" if task_data.assignee else "Unassigned")
        if task_data.priority and task_data.priority != task.priority:
            changes.append(f"Priority changed to '{task_data.priority}'")
        if task_data.due_date is not None and task_data.due_date != task.due_date:
            changes.append(f"Due date changed to {task_data.due_date.date()}")
            
        updated_task = await self.task_repository.update(task, task_data)
        
        if changes:
            await self._log_activity(task_id, user_id, org_id, "Updated task", ", ".join(changes))
            
        return updated_task

    async def delete_task(self, task_id: str, user_id: str, org_id: str) -> None:
        task = await self.task_repository.get_by_id(task_id, org_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
        await self.task_repository.delete(task)

    async def create_subtask(self, task_id: str, subtask_data: SubtaskCreate, user_id: str, org_id: str) -> Subtask:
        task = await self.get_task_by_id(task_id, org_id)
        subtask = Subtask(task_id=task.id, title=subtask_data.title, is_completed=subtask_data.is_completed)
        self.task_repository.db.add(subtask)
        await self.task_repository.db.commit()
        await self.task_repository.db.refresh(subtask)
        await self._log_activity(task_id, user_id, org_id, "Added subtask", f"Title: {subtask.title}")
        return subtask

    async def update_subtask(self, task_id: str, subtask_id: str, subtask_data: SubtaskUpdate, user_id: str, org_id: str) -> Subtask:
        await self.get_task_by_id(task_id, org_id)
        result = await self.task_repository.db.execute(
            __import__('sqlalchemy').select(Subtask).filter_by(id=subtask_id, task_id=task_id)
        )
        subtask = result.scalars().first()
        if not subtask:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")
            
        if subtask_data.title is not None:
            subtask.title = subtask_data.title
        if subtask_data.is_completed is not None:
            subtask.is_completed = subtask_data.is_completed
            await self._log_activity(task_id, user_id, org_id, "Completed subtask" if subtask.is_completed else "Unchecked subtask", subtask.title)
            
        await self.task_repository.db.commit()
        await self.task_repository.db.refresh(subtask)
        return subtask

    async def delete_subtask(self, task_id: str, subtask_id: str, user_id: str, org_id: str) -> None:
        await self.get_task_by_id(task_id, org_id)
        result = await self.task_repository.db.execute(
            __import__('sqlalchemy').select(Subtask).filter_by(id=subtask_id, task_id=task_id)
        )
        subtask = result.scalars().first()
        if subtask:
            await self.task_repository.db.delete(subtask)
            await self.task_repository.db.commit()

    async def create_comment(self, task_id: str, comment_data: CommentCreate, user_id: str, org_id: str) -> Comment:
        task = await self.get_task_by_id(task_id, org_id)
        comment = Comment(task_id=task.id, user_id=user_id, content=comment_data.content)
        self.task_repository.db.add(comment)
        await self.task_repository.db.commit()
        await self.task_repository.db.refresh(comment)
        await self._log_activity(task_id, user_id, org_id, "Added comment", comment.content)
        return comment

    async def get_task_activity(self, task_id: str, org_id: str) -> List[ActivityLog]:
        await self.get_task_by_id(task_id, org_id)
        result = await self.task_repository.db.execute(
            __import__('sqlalchemy').select(ActivityLog)
            .filter_by(task_id=task_id, org_id=org_id)
            .order_by(ActivityLog.created_at.desc())
        )
        return list(result.scalars().all())
