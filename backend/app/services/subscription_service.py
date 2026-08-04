import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status
from app.models.subscription import OrganizationSubscription
from app.models.invitation import Invitation, InvitationStatus
from app.core.clerk import clerk

PLAN_LIMITS = {
    "free": {"max_members": 2, "custom_statuses": False},
    "pro": {"max_members": 10, "custom_statuses": True},
    "team": {"max_members": 50, "custom_statuses": True},
    "enterprise": {"max_members": float('inf'), "custom_statuses": True}
}

class SubscriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def get_org_plan(self, org_id: str) -> str:
        """Fetch the current subscription plan for an organization."""
        result = await self.db.execute(select(OrganizationSubscription).filter_by(org_id=org_id))
        sub = result.scalars().first()
        if sub:
            return sub.plan
        return "free"
        
    async def check_can_invite_member(self, org_id: str):
        """Check if the organization can invite more members based on their plan."""
        plan = await self.get_org_plan(org_id)
        max_members = PLAN_LIMITS[plan]["max_members"]
        
        target_limit = 100 if max_members == float('inf') else int(max_members)
        try:
            await asyncio.to_thread(
                clerk.organizations.update,
                organization_id=org_id,
                max_allowed_memberships=target_limit
            )
        except Exception:
            pass
        
        if max_members == float('inf'):
            return
            
        try:
            clerk_members_response = await asyncio.to_thread(
                clerk.organization_memberships.list, 
                organization_id=org_id,
                limit=100
            )
            active_members_count = len(clerk_members_response.data) if hasattr(clerk_members_response, 'data') else len(clerk_members_response)
        except Exception:
            active_members_count = 1
            
        result = await self.db.execute(
            select(func.count(Invitation.id)).filter_by(
                organization_id=org_id, 
                status=InvitationStatus.pending
            )
        )
        pending_invites_count = result.scalar() or 0
        
        total_occupancy = active_members_count + pending_invites_count
        
        if total_occupancy >= max_members:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Member limit reached for '{plan.capitalize()}' plan. You have {active_members_count} active members and {pending_invites_count} pending invites (Limit: {max_members}). Please upgrade your plan."
            )
            
    async def check_task_status_allowed(self, org_id: str, new_status: str):
        """Check if the organization is allowed to use a custom status."""
        plan = await self.get_org_plan(org_id)
        allows_custom = PLAN_LIMITS[plan]["custom_statuses"]
        
        if not allows_custom:
            standard_statuses = ["to do", "in progress", "done"]
            if new_status.lower() not in standard_statuses:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="Custom task statuses are not available on the Free plan. Please upgrade your plan."
                )
