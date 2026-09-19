import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError

from app.core.config import settings
from app.core.exceptions import (
    integrity_error_handler,
    operational_error_handler,
    generic_db_error_handler,
)
from app.database.session import engine
from app.routers import health
from app.routers import auth
from app.routers import tasks
from app.routers import dashboard
from app.routers import email
from app.services.reminder_scheduler import reminder_scheduler_loop


import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Verify DB connectivity on startup, log email mode, start background reminder worker; log cleanly on shutdown."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]...")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Database connection verified ({settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}).")
    except Exception as e:
        logger.error(f"Database connection failed on startup: {e}")

    # Email Delivery Mode diagnostics (credentials are masked)
    email_mode = settings.get_email_mode()
    if email_mode == "real_smtp":
        logger.info(f"Email Engine: REAL GMAIL SMTP ACTIVE ({settings.SMTP_HOST}:{settings.SMTP_PORT}, TLS={settings.SMTP_TLS}).")
    elif email_mode == "misconfigured":
        logger.warning(f"Email Engine: EMAIL_ENABLED is True, but SMTP_PASSWORD is not set. Operating in Safe Dev Mode.")
    else:
        logger.info(f"Email Engine: SAFE DEV MODE (simulated email dispatch).")

    # Start background reminder scheduler worker
    reminder_task = None
    if settings.ENVIRONMENT != "testing":
        reminder_task = asyncio.create_task(reminder_scheduler_loop(poll_interval_seconds=30))

    yield

    # Cancel background worker cleanly on shutdown
    if reminder_task:
        reminder_task.cancel()
        try:
            await reminder_task
        except asyncio.CancelledError:
            pass
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Global exception handlers
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(OperationalError, operational_error_handler)
app.add_exception_handler(SQLAlchemyError, generic_db_error_handler)

app.add_middleware(
    CORSMiddleware,
    # Allow localhost, 127.0.0.1, and private LAN IPs (192.168.*, 10.*, 172.16-31.*) with any port
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────────────────────────
# Health Checks: mounted at /health, /api/health, and /api/v1/health for backward compatibility
app.include_router(health.router)
app.include_router(health.router, prefix="/api")
app.include_router(health.router, prefix=settings.API_V1_STR)

# Auth: /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/verify-email, /api/auth/resend-verification
app.include_router(auth.router)

# Email diagnostics: /api/email/test and /api/v1/email/test
app.include_router(email.router)
app.include_router(email.router, prefix=settings.API_V1_STR)

# Tasks: /api/tasks (CRUD, calendar, filters, search, sort, pagination)
app.include_router(tasks.router)

# Dashboard: /api/dashboard/stats
app.include_router(dashboard.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": f"{settings.API_V1_STR}/docs",
        "health_check": "/health",
    }
