import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import get_current_user, AuthUser
from app.services.subscription_service import SubscriptionService
from app.core.clerk import clerk

router = APIRouter(prefix="/api/organizations", tags=["organizations"])

@router.get("/can-create")
async def can_create_organization(
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if the user is allowed to create another organization.
    A user can only be the creator/admin of 1 organization on the Free plan.
    """
    try:
        memberships = await asyncio.to_thread(clerk.users.get_organization_memberships, user_id=user.id, limit=100)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch user organizations from Clerk")

    admin_org_ids = []
    if hasattr(memberships, 'data'):
        data = memberships.data
    else:
        data = memberships
        
    for mem in data:
        if mem.role == "org:admin":
            admin_org_ids.append(mem.organization.id)
            
    if len(admin_org_ids) == 0:
        return {"can_create": True}
        
    subscription_service = SubscriptionService(db)
    for org_id in admin_org_ids:
        plan = await subscription_service.get_org_plan(org_id)
        if plan != "free":
            return {"can_create": True}
            
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You have reached the limit of 1 free organization. Please upgrade your existing organization to Pro to create more."
    )

@router.get("/{org_id}/plan")
async def get_org_plan(
    org_id: str,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the current subscription plan for the organization."""
    subscription_service = SubscriptionService(db)
    plan = await subscription_service.get_org_plan(org_id)
    return {"plan": plan}
