"""
Task service — business logic and database queries for tasks, calendar,
completion timing analytics, and dashboard statistics.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from fastapi import HTTPException, status


from app.models.task import Task, TaskStatus, TaskPriority, CompletionTiming
from app.schemas.task import TaskCreate, TaskUpdate, DashboardStatsResponse


def classify_completion(due_date: Optional[datetime], completed_at: datetime) -> str:
    """
    Compare actual completion timestamp with task deadline.

    Categories:
    - 'no_deadline': Task has no deadline set.
    - 'completed_on_time': Completed within precision window (+/- 60 seconds of deadline).
    - 'completed_early': Completed more than 60 seconds before deadline.
    - 'completed_late': Completed more than 60 seconds after deadline.
    """
    if due_date is None:
        return CompletionTiming.NO_DEADLINE.value

    # Normalize timezones to UTC for consistent arithmetic
    if due_date.tzinfo is None:
        due_date = due_date.replace(tzinfo=timezone.utc)
    if completed_at.tzinfo is None:
        completed_at = completed_at.replace(tzinfo=timezone.utc)

    diff_seconds = (completed_at - due_date).total_seconds()

    # 60 second precision tolerance window for "on time"
    if abs(diff_seconds) <= 60:
        return CompletionTiming.COMPLETED_ON_TIME.value
    elif diff_seconds < -60:
        return CompletionTiming.COMPLETED_EARLY.value
    else:
        return CompletionTiming.COMPLETED_LATE.value


def create_task(db: Session, user_id: int, payload: TaskCreate) -> Task:
    """Create a new task belonging to the specified user."""

    # Prevent duplicate tasks with the same title (case-insensitive) and due_date
    query = db.query(Task).filter(
        Task.user_id == user_id,
        func.lower(Task.title) == func.lower(payload.title)
    )
    if payload.due_date:
        existing_task = query.filter(func.date_trunc('minute', Task.due_date) == func.date_trunc('minute', payload.due_date)).first()
    else:
        existing_task = query.filter(Task.due_date.is_(None)).first()

    if existing_task:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A task with the same name and deadline already exists."
        )

    now_utc = datetime.now(timezone.utc)
    
    # If created directly with status == 'completed'
    completed_at = None
    completion_timing = None
    if payload.status == TaskStatus.COMPLETED:
        completed_at = now_utc
        completion_timing = classify_completion(payload.due_date, now_utc)

    task = Task(
        title=payload.title,
        description=payload.description,
        status=payload.status.value,
        priority=payload.priority.value,
        due_date=payload.due_date,
        reminder_minutes=payload.reminder_minutes,
        completed_at=completed_at,
        completion_timing=completion_timing,
        user_id=user_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_tasks(
    db: Session,
    user_id: int,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: Optional[int] = None,
    limit: Optional[int] = None,
) -> list[Task]:
    """Retrieve tasks belonging to the user with filtering, searching, and sorting."""
    query = db.query(Task).filter(Task.user_id == user_id)

    # Filter by status
    if status is not None:
        query = query.filter(Task.status == status.value)

    # Filter by priority
    if priority is not None:
        query = query.filter(Task.priority == priority.value)

    # Search by title
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(Task.title.ilike(search_term))

    # Sorting
    sort_column_map = {
        "created_at": Task.created_at,
        "updated_at": Task.updated_at,
        "due_date": Task.due_date,
        "completed_at": Task.completed_at,
        "title": Task.title,
    }

    if sort_by == "priority":
        priority_order = case(
            (Task.priority == TaskPriority.HIGH.value, 3),
            (Task.priority == TaskPriority.MEDIUM.value, 2),
            (Task.priority == TaskPriority.LOW.value, 1),
            else_=0,
        )
        order_expr = priority_order.asc() if sort_order == "asc" else priority_order.desc()
    elif sort_by in sort_column_map:
        col = sort_column_map[sort_by]
        order_expr = col.asc() if sort_order == "asc" else col.desc()
    else:
        order_expr = Task.created_at.desc()

    # Prioritize incomplete (pending) tasks at the top when viewing all tasks
    if status is None:
        status_priority = case(
            (Task.status == TaskStatus.PENDING.value, 0),
            (Task.status == TaskStatus.COMPLETED.value, 1),
            else_=2,
        )
        query = query.order_by(status_priority.asc(), order_expr)
    else:
        query = query.order_by(order_expr)

    # Pagination
    if page is not None and limit is not None:
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
    elif limit is not None:
        query = query.limit(limit)

    return query.all()


def get_calendar_tasks(
    db: Session,
    user_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> list[Task]:
    """
    Retrieve tasks for calendar view.
    Filters tasks by due_date range or returns tasks with deadlines.
    """
    query = db.query(Task).filter(Task.user_id == user_id)

    if start_date is not None:
        query = query.filter(Task.due_date >= start_date)
    if end_date is not None:
        query = query.filter(Task.due_date <= end_date)

    return query.order_by(Task.due_date.is_(None), Task.due_date.asc(), Task.created_at.asc()).all()


def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
    """Retrieve a single task by ID."""
    return db.query(Task).filter(Task.id == task_id).first()


def update_task(db: Session, task: Task, payload: TaskUpdate) -> Task:
    """Update editable fields of an existing task with completion status synchronization."""
    update_data = payload.model_dump(exclude_unset=True)

    new_title = payload.title if payload.title is not None else task.title
    new_due_date = payload.due_date if 'due_date' in update_data else task.due_date
    
    # Check if modifying to a duplicate
    query = db.query(Task).filter(
        Task.user_id == task.user_id,
        func.lower(Task.title) == func.lower(new_title),
        Task.id != task.id
    )
    if new_due_date:
        existing_task = query.filter(func.date_trunc('minute', Task.due_date) == func.date_trunc('minute', new_due_date)).first()
    else:
        existing_task = query.filter(Task.due_date.is_(None)).first()

    if existing_task:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A task with the same name and deadline already exists."
        )

    now_utc = datetime.now(timezone.utc)

    # Check status transition
    new_status = update_data.get("status")
    if new_status is not None:
        new_status_val = new_status.value if hasattr(new_status, "value") else str(new_status)
        if new_status_val == TaskStatus.COMPLETED.value and task.status != TaskStatus.COMPLETED.value:
            # First time marked completed
            task.status = TaskStatus.COMPLETED.value
            task.completed_at = now_utc
            effective_due = update_data.get("due_date", task.due_date)
            task.completion_timing = classify_completion(effective_due, now_utc)
        elif new_status_val == TaskStatus.PENDING.value and task.status == TaskStatus.COMPLETED.value:
            # Reopened completed task: reset completion tracking
            task.status = TaskStatus.PENDING.value
            task.completed_at = None
            task.completion_timing = None
        else:
            task.status = new_status_val
        update_data.pop("status", None)

    for field, value in update_data.items():
        if field == "priority" and value is not None:
            setattr(task, "priority", value.value if hasattr(value, "value") else value)
        else:
            setattr(task, field, value)

    # If due_date changed on an already completed task, recalculate timing if completed_at exists
    if "due_date" in update_data and task.status == TaskStatus.COMPLETED.value and task.completed_at:
        task.completion_timing = classify_completion(task.due_date, task.completed_at)

    task.updated_at = now_utc
    db.commit()
    db.refresh(task)
    return task


def update_task_status(db: Session, task: Task, status: TaskStatus) -> Task:
    """
    Update only the status of an existing task.
    - When completed: record completed_at and compute completion_timing.
    - When reopened: reset completed_at and completion_timing.
    - If already completed: keep original completed_at.
    """
    now_utc = datetime.now(timezone.utc)
    new_status_val = status.value

    if new_status_val == TaskStatus.COMPLETED.value:
        if task.status != TaskStatus.COMPLETED.value or not task.completed_at:
            task.completed_at = now_utc
            task.completion_timing = classify_completion(task.due_date, now_utc)
        task.status = TaskStatus.COMPLETED.value
    else:
        # Reopening task
        task.status = TaskStatus.PENDING.value
        task.completed_at = None
        task.completion_timing = None

    task.updated_at = now_utc
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    """Delete a task from the database."""
    db.delete(task)
    db.commit()


def get_dashboard_stats(db: Session, user_id: int) -> DashboardStatsResponse:
    """
    Calculate dashboard metrics for a user using a single optimized aggregate query.
    - Total tasks
    - Completed tasks
    - Pending tasks
    - High-priority tasks
    - Overdue tasks (status == pending and due_date < current UTC time)
    Note: Completed tasks are never counted as overdue.
    """
    now_utc = datetime.now(timezone.utc)

    stats = (
        db.query(
            func.count(Task.id).label("total_tasks"),
            func.count(
                case((Task.status == TaskStatus.COMPLETED.value, Task.id))
            ).label("completed_tasks"),
            func.count(
                case((Task.status == TaskStatus.PENDING.value, Task.id))
            ).label("pending_tasks"),
            func.count(
                case((Task.priority == TaskPriority.HIGH.value, Task.id))
            ).label("high_priority_tasks"),
            func.count(
                case(
                    (
                        (Task.status == TaskStatus.PENDING.value)
                        & (Task.due_date.isnot(None))
                        & (Task.due_date < now_utc),
                        Task.id,
                    )
                )
            ).label("overdue_tasks"),
        )
        .filter(Task.user_id == user_id)
        .one()
    )

    return DashboardStatsResponse(
        total_tasks=stats.total_tasks or 0,
        completed_tasks=stats.completed_tasks or 0,
        pending_tasks=stats.pending_tasks or 0,
        high_priority_tasks=stats.high_priority_tasks or 0,
        overdue_tasks=stats.overdue_tasks or 0,
    )
