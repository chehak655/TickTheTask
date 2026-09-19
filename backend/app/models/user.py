from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    email_verification_token = Column(String(255), nullable=True, index=True)
    email_verification_expires_at = Column(DateTime(timezone=True), nullable=True)
    last_verification_sent_at = Column(DateTime(timezone=True), nullable=True)

    # 4-Digit OTP Email Verification fields
    verification_otp_hash = Column(String(255), nullable=True)
    verification_otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    verification_otp_attempts = Column(Integer, default=0, nullable=False)
    verification_otp_last_sent_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    reminder_logs = relationship("TaskReminderLog", back_populates="user", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}', verified={self.is_email_verified})>"
