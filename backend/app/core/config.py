import json
import os
from typing import List, Union
from pydantic import field_validator, model_validator, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "TickTheTask API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database settings
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "tickthetask_db"
    DATABASE_URL: str = ""

    # JWT Security settings
    # In production, SECRET_KEY MUST be explicitly configured via .env or environment variables.
    SECRET_KEY: str = Field(
        default="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
        repr=False,
        description="Cryptographic secret key for signing JWT tokens",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Email & Verification Settings
    FRONTEND_URL: str = "http://localhost:5173"
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    RESEND_VERIFICATION_COOLDOWN_SECONDS: int = 60

    # SMTP Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = Field(
        default="",
        repr=False,
        description="Google App Password or SMTP account password",
    )
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "TickTheTask"
    SMTP_TLS: bool = True
    SMTP_TIMEOUT_SECONDS: int = 15
    EMAIL_ENABLED: bool = False

    # Explicit allowed CORS origins for local and web clients
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://192.168.0.190:5173",
        "http://192.168.0.190:5174",
        "http://192.168.0.190:8081",
        "http://192.168.0.190:19006",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8081",
        "http://localhost:19006",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    parsed = json.loads(v_stripped)
                    if isinstance(parsed, list):
                        return [str(i).strip() for i in parsed if str(i).strip()]
                except Exception:
                    pass
            return [i.strip() for i in v_stripped.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip() for i in v if str(i).strip()]
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        """
        Enforce strict security requirements when running in production mode.
        """
        is_prod = self.ENVIRONMENT.lower() in ("production", "prod")
        default_dev_secret = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"

        # 1. Validate Secret Key
        if is_prod:
            if not self.SECRET_KEY or self.SECRET_KEY == default_dev_secret:
                raise ValueError(
                    "CRITICAL SECURITY CONFIGURATION ERROR: A strong, unique SECRET_KEY "
                    "must be explicitly configured in production. "
                    "Generate one using: openssl rand -hex 32"
                )
            if len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "CRITICAL SECURITY CONFIGURATION ERROR: Production SECRET_KEY "
                    "must be at least 32 characters long."
                )

        # 2. Validate CORS Wildcards with Credentials
        if is_prod and isinstance(self.BACKEND_CORS_ORIGINS, list):
            if "*" in self.BACKEND_CORS_ORIGINS:
                raise ValueError(
                    "CRITICAL SECURITY CONFIGURATION ERROR: Wildcard '*' in BACKEND_CORS_ORIGINS "
                    "is not allowed in production with credential-based authentication."
                )

        return self

    def get_email_mode(self) -> str:
        """
        Identify active email mode:
        - 'real_smtp': EMAIL_ENABLED is True and both username and password are provided.
        - 'misconfigured': EMAIL_ENABLED is True but credentials are missing.
        - 'safe_dev_mode': EMAIL_ENABLED is False.
        """
        if not self.EMAIL_ENABLED:
            return "safe_dev_mode"
        if bool(self.SMTP_USERNAME.strip()) and bool(self.SMTP_PASSWORD.strip()):
            return "real_smtp"
        return "misconfigured"

    def get_safe_smtp_diagnostics(self) -> dict:
        """Returns non-sensitive metadata about the SMTP configuration."""
        username = self.SMTP_USERNAME.strip()
        masked_user = (
            f"{username[:3]}...@{username.split('@')[-1]}"
            if "@" in username and len(username) > 6
            else ("configured" if username else "not_configured")
        )
        return {
            "email_enabled": self.EMAIL_ENABLED,
            "email_mode": self.get_email_mode(),
            "smtp_host": self.SMTP_HOST,
            "smtp_port": self.SMTP_PORT,
            "smtp_tls": self.SMTP_TLS,
            "smtp_timeout_seconds": self.SMTP_TIMEOUT_SECONDS,
            "smtp_user": masked_user,
            "smtp_password_configured": bool(self.SMTP_PASSWORD.strip()),
            "from_email": self.SMTP_FROM_EMAIL or self.SMTP_USERNAME,
            "from_name": self.SMTP_FROM_NAME,
        }

    def get_database_url(self) -> str:
        """Returns the configured database URL or constructs one for MySQL."""
        if self.DATABASE_URL and len(self.DATABASE_URL.strip()) > 0:
            return self.DATABASE_URL

        # Build MySQL connection string with utf8mb4 encoding
        password_part = f":{self.DB_PASSWORD}" if self.DB_PASSWORD else ""
        return (
            f"mysql+pymysql://{self.DB_USER}{password_part}@{self.DB_HOST}:{self.DB_PORT}/"
            f"{self.DB_NAME}?charset=utf8mb4"
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
