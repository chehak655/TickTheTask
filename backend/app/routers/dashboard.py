"""
Dashboard router — endpoints for dashboard statistics.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.task import DashboardStatsResponse
from app.core.dependencies import get_current_user
from app.services import task_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


# ---------------------------------------------------------------------------
# GET /api/dashboard/stats
# ---------------------------------------------------------------------------
@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve task metrics and statistics for the authenticated user",
)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns aggregated task counts:
    - total_tasks
    - completed_tasks
    - pending_tasks
    - high_priority_tasks
    - overdue_tasks
    """
    return task_service.get_dashboard_stats(db=db, user_id=current_user.id)
