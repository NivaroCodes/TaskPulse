from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.invitation import InvitationStatus

class InvitationCreate(BaseModel):
    recipient_email: EmailStr
    role: str

class InvitationUpdate(BaseModel):
    status: InvitationStatus