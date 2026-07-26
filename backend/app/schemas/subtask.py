from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class SubtaskCreate(BaseModel):
    title: str
    is_completed: bool = False

class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None

class SubtaskResponse(BaseModel):
    id: str
    task_id: str
    title: str
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
