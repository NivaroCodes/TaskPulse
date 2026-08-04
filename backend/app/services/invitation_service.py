import uuid
from datetime import datetime, timedelta, UTC
from typing import Optional, Any
from fastapi import HTTPException, status

from app.models.invitation import Invitation, InvitationStatus
from app.repositories.invitation_repository import InvitationRepository
from app.core.clerk import clerk
from app.core.config import settings
from app.utils.email_sender import send_email
from app.services.subscription_service import SubscriptionService

class InvitationService:
    def __init__(self, invitation_repository: InvitationRepository, subscription_service: SubscriptionService, clerk_client: Any = clerk, email_sender: Any = send_email):
        self.invitation_repository = invitation_repository
        self.subscription_service = subscription_service
        self.clerk_client = clerk_client
        self.email_sender = email_sender

    async def send_invitation(self, organization_id: str, sender_user_id: str, recipient_email: str, role: str) -> Invitation:
        await self.subscription_service.check_can_invite_member(organization_id)
        
        advanced_roles = ["org:project_manager", "org:viewer", "org:guest"]
        if role in advanced_roles:
            plan = await self.subscription_service.get_org_plan(organization_id)
            if plan not in ["team", "enterprise"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="Advanced roles (Project Manager, Viewer, Guest) are only available on Team or Enterprise plans."
                )

        existing_invite = await self.invitation_repository.get_pending_invitation_by_email(organization_id, recipient_email)
        if existing_invite:
            await self.invitation_repository.delete_invitation(existing_invite)

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

        email_html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; margin-bottom: 20px;">Welcome to TaskPulse!</h2>
            <p><strong>Hello,</strong></p>
            <p>You have been invited to join an organization on <strong>TaskPulse</strong> as a <strong>{role.replace('org:', '')}</strong>.</p>
            <p>TaskPulse is a platform for teams to collaborate and manage their tasks efficiently. To accept your invitation and join the team, please click the secure link below:</p>
            
            <div style="text-align: left; margin: 30px 0;">
              <a href="{invite_url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
            </div>
            
            <p style="font-size: 0.9em; color: #666;">Or copy and paste this link into your browser:<br>
            <a href="{invite_url}" style="color: #2563eb;">{invite_url}</a></p>
            
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            
            <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin-top: 0; font-size: 0.9em; color: #333;"><strong>⚠️ Important Deliverability Notice:</strong></p>
                <p style="margin-bottom: 0; font-size: 0.85em; color: #475569;">
                    If you found this email in your Spam or Junk folder, please help us by clicking <strong>"Report not spam"</strong> or <strong>"Not Spam"</strong>. 
                    We also highly recommend replying to this email with a quick <strong>"Got it!"</strong> or <strong>"Thanks!"</strong> — this teaches your email provider that you trust our messages and ensures you won't miss important notifications in the future.
                </p>
            </div>
            
            <p style="margin-top: 30px;">Welcome aboard!<br><strong>The TaskPulse Team</strong></p>
          </body>
        </html>
        """

        try:
            await self.email_sender(
                to_email=recipient_email,
                subject="You have been invited to join TaskPulse",
                body=email_body,
                html_body=email_html
            )
        except Exception as e:
            await self.invitation_repository.delete_invitation(invitation)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send email: {str(e)}"
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