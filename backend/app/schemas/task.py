from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List
from app.models.task import TaskStatus
from app.schemas.subtask import SubtaskResponse
from app.schemas.comment import CommentResponse

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.pending
    priority: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None
    org_id: str
    created_by:  str
    created_at: datetime
    updated_at: datetime
    subtasks: List[SubtaskResponse] = []
    comments: List[CommentResponse] = []

    class Config:
        from_attributes = True