from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class TaskReminderLog(Base):
    __tablename__ = "task_reminders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(
        Integer,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reminder_minutes = Column(Integer, nullable=False)
    sent_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    status = Column(String(20), default="sent", nullable=False)  # "sent", "failed"
    error_message = Column(Text, nullable=True)

    # Relationships
    task = relationship("Task", back_populates="reminder_logs")
    user = relationship("User", back_populates="reminder_logs")

    # Table constraints: unique per task and reminder interval to avoid duplicates
    __table_args__ = (
        UniqueConstraint("task_id", "reminder_minutes", name="uq_task_reminder_interval"),
    )

    def __repr__(self) -> str:
        return f"<TaskReminderLog(task_id={self.task_id}, reminder_minutes={self.reminder_minutes}, status='{self.status}')>"
