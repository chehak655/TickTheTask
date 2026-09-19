import os
import uuid
from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

from app.main import app
from app.core.config import settings
from app.database.session import Base, get_db

# Build connection URL for dedicated test database (taskflow_test_db)
TEST_DB_NAME = "taskflow_test_db"
from sqlalchemy.engine.url import make_url
TEST_DATABASE_URL = str(make_url(settings.get_database_url()).set(database="tickthetask_test_db"))

test_engine = create_engine(
    TEST_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Ensure all tables and columns exist in the dedicated test database before running tests.
    """
    Base.metadata.create_all(bind=test_engine)
    
    # Ensure all newly added Phase 15 columns exist in test database tables
    with test_engine.connect() as conn:
        try:
            user_cols = [row[0] for row in conn.execute(text("DESCRIBE users")).fetchall()]
            if "is_email_verified" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN NOT NULL DEFAULT FALSE"))
            if "email_verification_token" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL"))
            if "email_verification_expires_at" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN email_verification_expires_at DATETIME NULL"))
            if "last_verification_sent_at" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN last_verification_sent_at DATETIME NULL"))
            if "verification_otp_hash" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN verification_otp_hash VARCHAR(255) NULL"))
            if "verification_otp_expires_at" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN verification_otp_expires_at DATETIME NULL"))
            if "verification_otp_attempts" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN verification_otp_attempts INT NOT NULL DEFAULT 0"))
            if "verification_otp_last_sent_at" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN verification_otp_last_sent_at DATETIME NULL"))

            task_cols = [row[0] for row in conn.execute(text("DESCRIBE tasks")).fetchall()]
            if "completed_at" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN completed_at DATETIME NULL"))
            if "completion_timing" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN completion_timing VARCHAR(30) NULL"))
            conn.commit()
        except Exception as e:
            print(f"[!] Warning during test db migration check: {e}")

    yield


def override_get_db() -> Generator[Session, None, None]:
    """Dependency override that yields a session connected to the test database."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


# Override the FastAPI get_db dependency so ALL API requests hit the test database
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """FastAPI TestClient fixture using the dedicated test database."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Database session fixture providing a clean session per test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="function")
def db_session(db: Session) -> Session:
    """Alias for db fixture for tests expecting db_session name."""
    return db


@pytest.fixture(scope="function")
def auth_headers(client: TestClient) -> dict:
    """Create a verified test user and return authorization header."""
    uid = uuid.uuid4().hex[:8]
    email = f"user_{uid}@gmail.com"
    client.post(
        "/api/auth/register",
        json={"name": "Auth Tester", "email": email, "password": "Password123!"},
    )
    login_res = client.post(
        "/api/auth/login",
        json={"username": email, "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

