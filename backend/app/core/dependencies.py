"""
FastAPI dependencies: get_current_user, get_optional_current_user
Reads and validates the Bearer JWT on protected requests.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database.session import get_db
from app.models.user import User
from app.services.auth_service import get_user_by_id

# tokenUrl must match the actual login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials.",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the incoming Bearer token, look up the user, and return them.
    Raises HTTP 401 if missing or invalid.
    """
    try:
        payload = decode_access_token(token)
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise CREDENTIALS_EXCEPTION
    except JWTError:
        raise CREDENTIALS_EXCEPTION

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise CREDENTIALS_EXCEPTION

    user = get_user_by_id(db, user_id)
    if user is None:
        raise CREDENTIALS_EXCEPTION

    return user


def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Optional authentication: returns User if valid Bearer token present, else None.
    """
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        return get_user_by_id(db, int(user_id_str))
    except Exception:
        return None
