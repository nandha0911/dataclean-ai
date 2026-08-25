"""
FastAPI Entry Point — AI Data Cleaning & Imputation Recommendation Engine
==========================================================================
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from api.routes import analyze, clean, download, recommend, report, upload
from core.config import settings
from core.database import create_tables

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown logic."""
    logger.info("🚀  DataClean AI starting up …")

    # Create directories
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    os.makedirs(settings.MODELS_DIR, exist_ok=True)

    # Initialise database tables
    await create_tables()
    logger.info("✅  Database tables ready")

    # Pre-train or load the ML recommendation model
    try:
        from models.recommendation_model import RecommendationMLModel
        model = RecommendationMLModel()
        model.load_or_train()
        app.state.rec_model = model
        logger.info("✅  Recommendation ML model ready")
    except Exception as exc:
        logger.warning(f"⚠️   ML model init failed (rule engine will be used): {exc}")

    logger.info(f"🟢  {settings.APP_NAME} v{settings.VERSION} is live")
    yield
    logger.info("👋  DataClean AI shutting down …")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-Powered Data Cleaning & Imputation Recommendation Engine",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────────────────────────
API_PREFIX = "/api"
app.include_router(upload.router,    prefix=API_PREFIX, tags=["Upload"])
app.include_router(analyze.router,   prefix=API_PREFIX, tags=["Analysis"])
app.include_router(recommend.router, prefix=API_PREFIX, tags=["Recommendations"])
app.include_router(clean.router,     prefix=API_PREFIX, tags=["Cleaning"])
app.include_router(download.router,  prefix=API_PREFIX, tags=["Download"])
app.include_router(report.router,    prefix=API_PREFIX, tags=["Reports & Chat"])

# Also mount on root prefix so requests to /upload or /clean without /api succeed
app.include_router(upload.router,    tags=["Upload Root"])
app.include_router(analyze.router,   tags=["Analysis Root"])
app.include_router(recommend.router, tags=["Recommendations Root"])
app.include_router(clean.router,     tags=["Cleaning Root"])
app.include_router(download.router,  tags=["Download Root"])
app.include_router(report.router,    tags=["Reports & Chat Root"])


# ── Static file serving (deferred until dirs exist) ──────────────────────
@app.on_event("startup")
async def mount_static():
    if os.path.isdir(settings.UPLOAD_DIR):
        app.mount("/datasets", StaticFiles(directory=settings.UPLOAD_DIR), name="datasets")
    if os.path.isdir(settings.REPORTS_DIR):
        app.mount("/reports", StaticFiles(directory=settings.REPORTS_DIR), name="reports")


# ── Error handlers ────────────────────────────────────────────────────────
@app.exception_handler(404)
async def not_found(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": "Not found", "path": str(request.url)})


@app.exception_handler(500)
async def server_error(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Internal error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Health ─────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check() -> dict:
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.VERSION}


# ── Mount Frontend Single-Page App (SPA) if dist exists ───────────────────
# Enables hosting both React Frontend and FastAPI Backend under 1 single URL
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/", tags=["Health"])
    async def root() -> dict:
        return {"message": f"Welcome to {settings.APP_NAME}", "docs": "/docs"}


# ── AWS Lambda Handler (via Mangum) ───────────────────────────────────────
# When deployed to AWS Lambda, the `handler` is the entry point.
# Mangum wraps the FastAPI ASGI app so Lambda understands HTTP events.
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    pass  # mangum not installed — running locally with uvicorn
