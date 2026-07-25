import uuid
from datetime import datetime, timedelta, UTC
from typing import Optional, Any
from fastapi import HTTPException, status

from app.models.invitation import Invitation, InvitationStatus
from app.repositories.invitation_repository import InvitationRepository
from app.core.clerk import clerk
from app.core.config import settings
from app.utils.email_sender import send_email

class InvitationService:
    def __init__(self, invitation_repository: InvitationRepository, clerk_client: Any = clerk, email_sender: Any = send_email):
        self.invitation_repository = invitation_repository
        self.clerk_client = clerk_client
        self.email_sender = email_sender

    async def send_invitation(self, organization_id: str, sender_user_id: str, recipient_email: str, role: str) -> Invitation:
        existing_invite = await self.invitation_repository.get_pending_invitation_by_email(organization_id, recipient_email)
        if existing_invite:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A pending invitation has already been sent to this email.")

        expires_at = datetime.now(UTC) + timedelta(hours=24)
        
        invitation = await self.invitation_repository.create_invitation(
            org_id=organization_id,
            sender_id=sender_user_id,
            recipient_email=recipient_email,
            role=role,
            expires_at=expires_at
        )
        
        invite_url = f"{settings.FRONTEND_URL}/invite/{invitation.token}"
        
        email_body = f"""Hello,

You have been invited to join an organization on TaskPulse as a {role.replace('org:', '')}.

TaskPulse is a platform for teams to collaborate and manage their tasks efficiently. 
To accept your invitation and join the team, please click the secure link below:

{invite_url}

---
Important Deliverability Notice: 
If you found this email in your Spam or Junk folder, please help us by clicking "Report not spam" or "Not Spam". 
We also highly recommend replying to this email with a quick "Got it!" or "Thanks!" — this teaches your email provider that you trust our messages and ensures you won't miss important notifications in the future.

Welcome aboard!
The TaskPulse Team
"""
        await self.email_sender(
            to_email=recipient_email,
            subject="You have been invited to join TaskPulse",
            body=email_body
        )
        
        return invitation

    async def approve_invitation(self, invitation_id: str, approver_user_id: str) -> Invitation:
        invitation = await self.invitation_repository.get_invitation_by_id(invitation_id)
        if not invitation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
            
        if invitation.status != InvitationStatus.pending:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation is not pending")
            
        if invitation.expires_at < datetime.now(UTC):
            await self.invitation_repository.update_invitation_status(invitation, InvitationStatus.expired)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation has expired")
            
        return await self.invitation_repository.update_invitation_status(invitation, InvitationStatus.approved)

    async def accept_invitation(self, token: str, invited_user_id: str) -> Invitation:
        invitation = await self.invitation_repository.get_invitation_by_token(token)
        if not invitation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
            
        if invitation.status not in [InvitationStatus.pending, InvitationStatus.approved]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation is not valid for acceptance")
            
        if invitation.expires_at < datetime.now(UTC):
            await self.invitation_repository.update_invitation_status(invitation, InvitationStatus.expired)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation has expired")
            
        try:
            await self.clerk_client.organization_memberships.create_async(
                organization_id=invitation.organization_id,
                user_id=invited_user_id,
                role=invitation.role
            )
        except Exception as e:
            error_msg = str(e)
            if "already a member" in error_msg or "already_a_member_in_organization" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="You are already a member of this organization."
                )
            else:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to add to organization: {error_msg}")
            
        return await self.invitation_repository.update_invitation_status(invitation, InvitationStatus.accepted)

    async def decline_invitation(self, token: str) -> Invitation:
        invitation = await self.invitation_repository.get_invitation_by_token(token)
        if not invitation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
            
        if invitation.status == InvitationStatus.accepted:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation already accepted")
            
        return await self.invitation_repository.update_invitation_status(invitation, InvitationStatus.declined)

    async def get_invitation_details_by_token(self, token: str) -> Invitation:
        invitation = await self.invitation_repository.get_invitation_by_token(token)
        if not invitation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
            
        if invitation.expires_at < datetime.now(UTC) and invitation.status == InvitationStatus.pending:
            await self.invitation_repository.update_invitation_status(invitation, InvitationStatus.expired)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation has expired")
            
        return invitation