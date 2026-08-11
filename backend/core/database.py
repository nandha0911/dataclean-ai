"""
Database Setup
===============
SQLAlchemy async engine, session factory, ORM models, and table creation.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from core.config import get_settings

settings = get_settings()

# ── Engine & session ─────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False},
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


# ── ORM Models ───────────────────────────────────────────────────────────────

class Dataset(Base):
    """Uploaded dataset metadata."""

    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), index=True, nullable=False)
    original_path = Column(String(512), nullable=False)
    cleaned_path = Column(String(512), nullable=True)
    upload_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="uploaded")
    row_count = Column(Integer, nullable=True)
    col_count = Column(Integer, nullable=True)


class AnalysisJob(Base):
    """Analysis job tracking and cached results."""

    __tablename__ = "analysis_jobs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, index=True, nullable=False)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    result_json = Column(JSON, nullable=True)
    quality_score_json = Column(JSON, nullable=True)


class CleaningJob(Base):
    """Cleaning job tracking."""

    __tablename__ = "cleaning_jobs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, index=True, nullable=False)
    operations_json = Column(JSON, nullable=True)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    stats_json = Column(JSON, nullable=True)


# ── Helpers ──────────────────────────────────────────────────────────────────

async def create_tables() -> None:
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """FastAPI dependency: yield an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
