from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.auth import get_current_user, AuthUser
from app.services.invitation_service import InvitationService
from app.repositories.invitation_repository import InvitationRepository
from app.schemas.invitation import InvitationCreate
from app.models.invitation import InvitationStatus

router = APIRouter()

class InvitationResponse(BaseModel):
    id: str
    organization_id: str
    sender_user_id: str
    recipient_email: str
    role: str
    token: str
    status: InvitationStatus
    expires_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

def get_invitation_service(db: AsyncSession = Depends(get_db)) -> InvitationService:
    repository = InvitationRepository(db)
    return InvitationService(invitation_repository=repository)

@router.post("/api/organizations/{org_id}/invitations", response_model=InvitationResponse)
async def send_invitation(
    org_id: str,
    data: InvitationCreate,
    current_user: AuthUser = Depends(get_current_user),
    service: InvitationService = Depends(get_invitation_service)
):
    if not current_user.has_permission("org:members:invite"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing org:members:invite permission")
    
    return await service.send_invitation(
        organization_id=org_id,
        sender_user_id=current_user.user_id,
        recipient_email=data.recipient_email,
        role=data.role
    )

@router.get("/api/invitations/{token}", response_model=InvitationResponse)
async def get_invitation(
    token: str,
    service: InvitationService = Depends(get_invitation_service)
):
    return await service.get_invitation_details_by_token(token)

@router.post("/api/invitations/{token}/approve", response_model=InvitationResponse)
async def approve_invitation(
    token: str,
    current_user: AuthUser = Depends(get_current_user),
    service: InvitationService = Depends(get_invitation_service)
):
    if not current_user.has_permission("org:members:manage"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing org:members:manage permission")
        
    invitation = await service.get_invitation_details_by_token(token)
    return await service.approve_invitation(invitation.id, current_user.user_id)

@router.post("/api/invitations/{token}/accept", response_model=InvitationResponse)
async def accept_invitation(
    token: str,
    current_user: AuthUser = Depends(get_current_user),
    service: InvitationService = Depends(get_invitation_service)
):
    return await service.accept_invitation(token, current_user.user_id)

@router.post("/api/invitations/{token}/decline", response_model=InvitationResponse)
async def decline_invitation(
    token: str,
    service: InvitationService = Depends(get_invitation_service)
):
    return await service.decline_invitation(token)