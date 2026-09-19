import pytest
from pydantic import ValidationError
from app.core.config import Settings


def test_production_rejects_default_secret():
    with pytest.raises(ValidationError) as excinfo:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
            BACKEND_CORS_ORIGINS=["http://localhost:5173"],
        )
    assert "CRITICAL SECURITY CONFIGURATION ERROR" in str(excinfo.value)


def test_production_rejects_short_secret():
    with pytest.raises(ValidationError) as excinfo:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="short-secret-key",
            BACKEND_CORS_ORIGINS=["http://localhost:5173"],
        )
    assert "at least 32 characters" in str(excinfo.value)


def test_production_rejects_wildcard_cors():
    with pytest.raises(ValidationError) as excinfo:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="a" * 32,
            BACKEND_CORS_ORIGINS=["*"],
        )
    assert "Wildcard '*' in BACKEND_CORS_ORIGINS" in str(excinfo.value)


def test_production_accepts_strong_secret_and_explicit_cors():
    cfg = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="e4d909c290d0fb1ca068ffaddf22cbd0e4d909c290d0fb1ca068ffaddf22cbd0",
        BACKEND_CORS_ORIGINS=["https://app.taskflow.com", "https://api.taskflow.com"],
    )
    assert cfg.ENVIRONMENT == "production"
    assert cfg.SECRET_KEY.startswith("e4d909")
    assert "*" not in cfg.BACKEND_CORS_ORIGINS


def test_development_mode_loads_cleanly():
    cfg = Settings(
        ENVIRONMENT="development",
        SECRET_KEY="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
    )
    assert cfg.ENVIRONMENT == "development"
