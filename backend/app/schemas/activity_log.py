from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class ActivityLogResponse(BaseModel):
    id: str
    org_id: str
    task_id: str
    user_id: str
    action: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
