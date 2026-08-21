"""
Application Configuration
===========================
Central settings class loaded from environment variables or .env file.
"""
from __future__ import annotations

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Global application settings."""

    # ── Application ───────────────────────────────────────────────────────
    APP_NAME: str = "DataClean AI"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # ── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./datacleaner.db"

    # ── File Storage ──────────────────────────────────────────────────────
    UPLOAD_DIR: str = "datasets"
    REPORTS_DIR: str = "reports"
    MODELS_DIR: str = "models"
    MAX_FILE_SIZE_MB: int = 500
    ALLOWED_EXTENSIONS: list[str] = [".csv", ".xlsx", ".xls", ".json"]

    # ── Analysis thresholds ───────────────────────────────────────────────
    OUTLIER_ZSCORE_THRESHOLD: float = 3.0
    HIGH_CARDINALITY_RATIO: float = 0.9
    LOW_CARDINALITY_MAX: int = 20
    MISSING_HIGH_THRESHOLD: float = 0.30
    MISSING_LOW_THRESHOLD: float = 0.05
    CORRELATION_HIGH_THRESHOLD: float = 0.85
    SKEWNESS_THRESHOLD: float = 1.0
    VIF_THRESHOLD: float = 10.0

    # ── ML Model ──────────────────────────────────────────────────────────
    MODEL_PATH: str = "models/rec_model.pkl"
    SYNTHETIC_DATA_SIZE: int = 1200

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()


# Convenience singleton for modules that import `settings` directly
settings = get_settings()
