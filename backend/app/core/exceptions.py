from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError


class DatabaseConnectionError(Exception):
    """Raised when database connection cannot be established."""
    pass


class DuplicateResourceError(Exception):
    """Raised when a unique constraint (like email) is violated."""
    def __init__(self, message: str = "A resource with this identifier already exists."):
        self.message = message
        super().__init__(self.message)


async def integrity_error_handler(request: Request, exc: IntegrityError):
    """Handles database integrity violations such as duplicate keys or foreign key errors."""
    error_msg = str(exc.orig) if hasattr(exc, "orig") else str(exc)
    
    # Check for duplicate entry (MySQL error 1062)
    if "1062" in error_msg or "Duplicate entry" in error_msg or "UNIQUE constraint failed" in error_msg:
        if "email" in error_msg.lower():
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"detail": "An account with this email address already exists."}
            )
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "A duplicate record with this unique attribute already exists."}
        )
    
    # Foreign key violations
    if "1452" in error_msg or "FOREIGN KEY constraint failed" in error_msg:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Referenced resource does not exist."}
        )

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": "Database constraint violation."}
    )


async def operational_error_handler(request: Request, exc: OperationalError):
    """Handles operational database errors such as dropped connections or server offline."""
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database service is currently unavailable. Please try again later."}
    )


async def generic_db_error_handler(request: Request, exc: SQLAlchemyError):
    """Catches any remaining database layer exceptions."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal database error occurred."}
    )
