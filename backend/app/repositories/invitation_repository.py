from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
from app.models.invitation import Invitation, InvitationStatus

class InvitationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_invitation(self, org_id: str, sender_id: str, recipient_email: str, role: str, expires_at: datetime) -> Invitation:
        new_invitation = Invitation(
            organization_id=org_id,
            sender_user_id=sender_id,
            recipient_email=recipient_email,
            role=role,
            expires_at=expires_at
        )
        self.db.add(new_invitation)
        await self.db.commit()
        await self.db.refresh(new_invitation)
        return new_invitation

    async def get_invitation_by_token(self, token: str) -> Optional[Invitation]:
        result = await self.db.execute(select(Invitation).filter_by(token=token))
        return result.scalars().first()

    async def get_pending_invitation_by_email(self, org_id: str, email: str) -> Optional[Invitation]:
        result = await self.db.execute(
            select(Invitation).filter_by(
                organization_id=org_id, 
                recipient_email=email, 
                status=InvitationStatus.pending
            )
        )
        return result.scalars().first()

    async def get_invitation_by_id(self, invitation_id: str) -> Optional[Invitation]:
        result = await self.db.execute(select(Invitation).filter_by(id=invitation_id))
        return result.scalars().first()

    async def update_invitation_status(self, invitation: Invitation, status: InvitationStatus) -> Invitation:
        invitation.status = status
        await self.db.commit()
        await self.db.refresh(invitation)
        return invitation

    async def delete_invitation(self, invitation: Invitation) -> None:
        await self.db.delete(invitation)
        await self.db.commit()