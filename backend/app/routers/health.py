from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.session import get_db
from app.schemas.health import HealthResponse, DetailedHealthResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
def health_check():
    """Basic health check returning status ok."""
    return {"status": "ok"}


@router.get("/health/details", response_model=DetailedHealthResponse, status_code=status.HTTP_200_OK)
def detailed_health_check(db: Session = Depends(get_db)):
    """Comprehensive health check including database verification."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unreachable ({str(e)})"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "database": db_status,
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }
