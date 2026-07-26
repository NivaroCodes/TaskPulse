from datetime import datetime
from pydantic import BaseModel

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: str
    task_id: str
    user_id: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
