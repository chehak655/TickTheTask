import uuid
from datetime import datetime, timezone
import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.models import User, Task, TaskStatus, TaskPriority


def test_mysql_is_reachable(db):
    """Verify that MySQL is reachable and executes standard SQL."""
    result = db.execute(text("SELECT 1 AS alive")).fetchone()
    assert result is not None
    assert result[0] == 1


def test_database_session_crud(db):
    """Verify database session can create, read, update, and delete models."""
    unique_email = f"architect_{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        name="Senior Architect",
        email=unique_email,
        password_hash="$2b$12$e8Y6.fakehashedpasswordstringforvalidation",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    assert user.id is not None
    assert user.name == "Senior Architect"
    assert user.email == unique_email
    assert user.created_at is not None

    # Create associated task
    task = Task(
        title="Verify Phase 2 Database Setup",
        description="Ensure MySQL connection and SQLAlchemy models are verified.",
        status=TaskStatus.PENDING.value,
        priority=TaskPriority.HIGH.value,
        user_id=user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    assert task.id is not None
    assert task.user_id == user.id
    assert task.status == "pending"
    assert task.priority == "high"
    assert task.created_at is not None
    assert task.updated_at is not None

    # Relationship verification
    assert task.user.id == user.id
    assert len(user.tasks) >= 1
    assert user.tasks[0].id == task.id

    # Clean up test records
    db.delete(user)
    db.commit()

    # Verify cascade delete
    deleted_task = db.query(Task).filter_by(id=task.id).first()
    assert deleted_task is None


def test_email_uniqueness_constraint(db):
    """Verify that attempting to create duplicate email triggers IntegrityError."""
    unique_email = f"duplicate_{uuid.uuid4().hex[:8]}@example.com"

    user1 = User(
        name="User One",
        email=unique_email,
        password_hash="hash_one_123",
    )
    db.add(user1)
    db.commit()

    user2 = User(
        name="User Two",
        email=unique_email,
        password_hash="hash_two_456",
    )
    db.add(user2)

    with pytest.raises(IntegrityError):
        db.commit()

    db.rollback()

    # Clean up user1
    db.delete(user1)
    db.commit()
