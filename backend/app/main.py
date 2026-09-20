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
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter



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

    yield

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


app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# ── Routers ─────────────────────────────────────────────────────────────────
from app.database.session import engine
from app.models import Base

@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)

# Health Checks: mounted at /health, /api/health, and /api/v1/health for backward compatibility
app.include_router(health.router)
app.include_router(health.router, prefix="/api")
app.include_router(health.router, prefix=settings.API_V1_STR)

# Auth: /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/verify-email, /api/auth/resend-verification
app.include_router(auth.router)

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


