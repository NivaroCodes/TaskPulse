import json
from datetime import UTC, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.auth import get_current_user, AuthUser
from app.core.database import get_db
from app.models.task import Task
from app.models.activity_log import ActivityLog
from app.services.subscription_service import SubscriptionService
from app.schemas.ai import (
    GenerateSubtasksRequest,
    GenerateSubtasksResponse,
    ImproveTextRequest,
    ImproveTextResponse,
    SprintInsightsRequest,
    SprintInsightsResponse,
)
from app.services import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/generate-subtasks", response_model=GenerateSubtasksResponse)
async def generate_subtasks(
    request: GenerateSubtasksRequest,
    user: AuthUser = Depends(get_current_user)
):
    subtasks = await ai_service.generate_subtasks(
        title=request.title,
        description=request.description
    )
    return GenerateSubtasksResponse(subtasks=subtasks)


@router.post("/improve-text", response_model=ImproveTextResponse)
async def improve_text(
    request: ImproveTextRequest,
    user: AuthUser = Depends(get_current_user)
):
    improved_text = await ai_service.improve_text(request.text)
    return ImproveTextResponse(improved_text=improved_text)


@router.post("/sprint-insights", response_model=SprintInsightsResponse)
async def get_sprint_insights(
    request: SprintInsightsRequest,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.role not in ["admin", "project_manager", "org:admin", "org:project_manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins and Project Managers can generate AI sprint insights."
        )

    subscription_service = SubscriptionService(db)
    plan = await subscription_service.get_org_plan(user.org_id)
    if plan not in ["team", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Sprint Insights require Team or Enterprise plan."
        )

    name_map = request.member_names or {}

    def get_name(user_id: str | None) -> str:
        if not user_id:
            return "Не назначено"
        return name_map.get(user_id, f"Участник команды ({user_id[:6]})")

    tasks_result = await db.execute(select(Task).where(Task.org_id == user.org_id))
    tasks = tasks_result.scalars().all()

    total_tasks = len(tasks)
    completed = len([t for t in tasks if t.status == "completed"])
    in_progress = len([t for t in tasks if t.status == "started"])
    pending = len([t for t in tasks if t.status == "pending"])

    now = datetime.now(UTC)
    overdue_tasks = [
        f"Задача: '{t.title}', Исполнитель: {get_name(t.assignee)}"
        for t in tasks
        if t.due_date and t.due_date < now and t.status != "completed"
    ]

    workload: dict[str, int] = {}
    for t in tasks:
        if t.assignee:
            aname = get_name(t.assignee)
            workload[aname] = workload.get(aname, 0) + 1

    logs_result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.org_id == user.org_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(15)
    )
    logs = logs_result.scalars().all()
    recent_actions = [f"Участник {get_name(l.user_id)} выполнил действие '{l.action}' в задаче {l.task_id[:8]}" for l in logs]

    stats_dict = {
        "total_tasks": total_tasks,
        "status_distribution": {"completed": completed, "in_progress": in_progress, "pending": pending},
        "overdue_tasks_count": len(overdue_tasks),
        "overdue_tasks_details": overdue_tasks,
        "workload_by_member_name": workload,
        "recent_team_activity": recent_actions,
    }

    summary_text = json.dumps(stats_dict, ensure_ascii=False, indent=2)
    insights = await ai_service.generate_sprint_insights(summary_text)
    return SprintInsightsResponse(insights=insights)