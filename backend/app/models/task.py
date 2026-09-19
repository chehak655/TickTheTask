import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Index,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class CompletionTiming(str, enum.Enum):
    COMPLETED_EARLY = "completed_early"
    COMPLETED_ON_TIME = "completed_on_time"
    COMPLETED_LATE = "completed_late"
    NO_DEADLINE = "no_deadline"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(
        String(20),
        default=TaskStatus.PENDING.value,
        nullable=False,
        index=True
    )
    priority = Column(
        String(20),
        default=TaskPriority.MEDIUM.value,
        nullable=False,
        index=True
    )
    due_date = Column(DateTime(timezone=True), nullable=True, index=True)
    reminder_minutes = Column(Integer, default=15, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    completion_timing = Column(String(30), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Relationships
    user = relationship("User", back_populates="tasks")
    reminder_logs = relationship("TaskReminderLog", back_populates="task", cascade="all, delete-orphan", lazy="selectin")

    # Table constraints and indexes
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'completed')", name="check_task_status"),
        CheckConstraint("priority IN ('low', 'medium', 'high')", name="check_task_priority"),
        Index("idx_tasks_user_status", "user_id", "status"),
        Index("idx_tasks_user_priority", "user_id", "priority"),
        Index("idx_tasks_user_due_date", "user_id", "due_date"),
    )

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', status='{self.status}', timing='{self.completion_timing}')>"
