"""
Task router — CRUD endpoints, calendar view, and status lifecycle.
"""
from datetime import datetime
from typing import Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.task import Task, TaskStatus, TaskPriority
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskRead,
    TaskDeleteResponse,
)
from app.core.dependencies import get_current_user
from app.services import task_service

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def _get_user_task(db: Session, task_id: int, user_id: int) -> Task:
    """
    Retrieve task and enforce ownership.
    Returns 404 if not found, 403 if owned by another user.
    """
    task = task_service.get_task_by_id(db, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )
    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this task.",
        )
    return task


# ---------------------------------------------------------------------------
# POST /api/tasks
# ---------------------------------------------------------------------------
@router.post(
    "",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new task for the authenticated user.
    """
    return task_service.create_task(db, user_id=current_user.id, payload=payload)


# ---------------------------------------------------------------------------
# GET /api/tasks
# ---------------------------------------------------------------------------
@router.get(
    "",
    response_model=list[TaskRead],
    status_code=status.HTTP_200_OK,
    summary="Retrieve tasks with filtering, search, sorting, and pagination",
)
def get_tasks(
    status: Optional[TaskStatus] = Query(None, description="Filter by status ('pending', 'completed')"),
    priority: Optional[TaskPriority] = Query(None, description="Filter by priority ('low', 'medium', 'high')"),
    search: Optional[str] = Query(None, description="Search tasks by title"),
    sort_by: str = Query("created_at", description="Sort by field: 'created_at', 'updated_at', 'due_date', 'priority', 'title'"),
    sort_order: Literal["asc", "desc"] = Query("desc", description="Sort order ('asc' or 'desc')"),
    page: Optional[int] = Query(None, ge=1, description="Page number for pagination"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all tasks for the authenticated user.
    """
    return task_service.get_tasks(
        db=db,
        user_id=current_user.id,
        status=status,
        priority=priority,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )


# ---------------------------------------------------------------------------
# GET /api/tasks/calendar (MUST BE ABOVE /{task_id})
# ---------------------------------------------------------------------------
@router.get(
    "/calendar",
    response_model=list[TaskRead],
    status_code=status.HTTP_200_OK,
    summary="Retrieve tasks for calendar view with optional date range filter",
)
def get_calendar_tasks(
    start_date: Optional[str] = Query(None, description="Start date (ISO-8601 string)"),
    end_date: Optional[str] = Query(None, description="End date (ISO-8601 string)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve tasks for calendar representation.
    Filters tasks with deadlines within the specified date range.
    """
    start_dt = None
    end_dt = None
    if start_date:
        try:
            cleaned = start_date.replace(" ", "+")
            start_dt = datetime.fromisoformat(cleaned)
        except Exception:
            pass
    if end_date:
        try:
            cleaned = end_date.replace(" ", "+")
            end_dt = datetime.fromisoformat(cleaned)
        except Exception:
            pass

    return task_service.get_calendar_tasks(
        db=db,
        user_id=current_user.id,
        start_date=start_dt,
        end_date=end_dt,
    )


# ---------------------------------------------------------------------------
# GET /api/tasks/{task_id}
# ---------------------------------------------------------------------------
@router.get(
    "/{task_id}",
    response_model=TaskRead,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a single task by ID",
)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve a specific task by ID. Verifies ownership.
    """
    return _get_user_task(db, task_id, current_user.id)


# ---------------------------------------------------------------------------
# PUT /api/tasks/{task_id}
# ---------------------------------------------------------------------------
@router.put(
    "/{task_id}",
    response_model=TaskRead,
    status_code=status.HTTP_200_OK,
    summary="Update a task",
)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update details of a task (title, description, status, priority, due_date).
    Verifies ownership.
    """
    task = _get_user_task(db, task_id, current_user.id)
    return task_service.update_task(db, task=task, payload=payload)


# ---------------------------------------------------------------------------
# PATCH /api/tasks/{task_id}/status
# ---------------------------------------------------------------------------
@router.patch(
    "/{task_id}/status",
    response_model=TaskRead,
    status_code=status.HTTP_200_OK,
    summary="Update task status (pending or completed)",
)
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Quick status update endpoint (mark as completed or pending) with completion analytics.
    Verifies ownership.
    """
    task = _get_user_task(db, task_id, current_user.id)
    return task_service.update_task_status(db, task=task, status=payload.status)


# ---------------------------------------------------------------------------
# DELETE /api/tasks/{task_id}
# ---------------------------------------------------------------------------
@router.delete(
    "/{task_id}",
    response_model=TaskDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a task",
)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a specific task. Verifies ownership.
    """
    task = _get_user_task(db, task_id, current_user.id)
    task_service.delete_task(db, task=task)
    return TaskDeleteResponse(id=task_id, message="Task deleted successfully")
