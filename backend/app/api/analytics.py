from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.auth import get_current_user, AuthUser
from app.models.task import Task
from app.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/{org_id}")
async def get_analytics(
    org_id: str,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    subscription_service = SubscriptionService(db)
    plan = await subscription_service.get_org_plan(org_id)
    if plan not in ["team", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Analytics are only available on Team or Enterprise plans."
        )

    total_query = await db.execute(select(func.count()).select_from(Task).where(Task.org_id == org_id))
    total_tasks = total_query.scalar() or 0

    completed_query = await db.execute(select(func.count()).select_from(Task).where(Task.org_id == org_id, Task.status == "completed"))
    completed_tasks = completed_query.scalar() or 0

    started_query = await db.execute(select(func.count()).select_from(Task).where(Task.org_id == org_id, Task.status == "started"))
    started_tasks = started_query.scalar() or 0

    pending_query = await db.execute(select(func.count()).select_from(Task).where(Task.org_id == org_id, Task.status == "pending"))
    pending_tasks = pending_query.scalar() or 0

    status_distribution = [
        {"name": "Pending", "value": pending_tasks},
        {"name": "Started", "value": started_tasks},
        {"name": "Completed", "value": completed_tasks},
    ]

    workload_query = await db.execute(
        select(Task.assignee, func.count(Task.id))
        .where(Task.org_id == org_id)
        .where(Task.assignee.isnot(None))
        .where(Task.assignee != "")
        .group_by(Task.assignee)
    )
    workload_results = workload_query.all()
    
    workload_distribution = []
    for assignee_id, count in workload_results:
        short_id = assignee_id.split("_")[-1][:5] if "_" in assignee_id else assignee_id[:5]
        workload_distribution.append({
            "name": f"User {short_id}",
            "tasks": count,
            "full_id": assignee_id
        })

    return {
        "summary": {
            "total": total_tasks,
            "completed": completed_tasks,
            "started": started_tasks,
            "pending": pending_tasks,
        },
        "statusDistribution": status_distribution,
        "workloadDistribution": workload_distribution,
    }
