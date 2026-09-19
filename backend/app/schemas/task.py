from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, field_serializer
from app.models.task import TaskStatus, TaskPriority, CompletionTiming


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Task title")
    description: Optional[str] = Field(None, max_length=2000, description="Detailed task description")
    status: TaskStatus = Field(default=TaskStatus.PENDING, description="Task status (pending or completed)")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority (low, medium, high)")
    due_date: Optional[datetime] = Field(None, description="Due date and time in UTC")
    reminder_minutes: Optional[int] = Field(15, description="Minutes before due date to trigger reminder")

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title must not be empty or whitespace only.")
        return v.strip()


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    reminder_minutes: Optional[int] = None

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.strip():
                raise ValueError("Title must not be empty or whitespace only.")
            return v.strip()
        return v


class TaskStatusUpdate(BaseModel):
    status: TaskStatus = Field(..., description="New task status ('pending' or 'completed')")


class TaskRead(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[datetime]
    reminder_minutes: Optional[int] = 15
    completed_at: Optional[datetime] = None
    completion_timing: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user_id: int

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("due_date", "completed_at", "created_at", "updated_at", when_used="json")
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()


class DashboardStatsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    high_priority_tasks: int
    overdue_tasks: int


class TaskDeleteResponse(BaseModel):
    message: str = "Task deleted successfully"
    id: int
