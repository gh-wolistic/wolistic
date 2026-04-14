from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.router import api_router
from app.core.config import get_settings
from app.core.middleware import RequestIDMiddleware
from app.core.logging_config import setup_logging

settings = get_settings()

# Configure logging based on environment
setup_logging()

app = FastAPI(title=settings.APP_NAME)

# Request ID middleware (must be added first for proper tracing)
app.add_middleware(RequestIDMiddleware)

# CORS middleware with environment-based configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"] if settings.CORS_ALLOW_ALL_METHODS else ["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"] if settings.CORS_ALLOW_ALL_HEADERS else [
        "Authorization",
        "Content-Type",
        "X-Request-ID",
        "Accept",
        "Accept-Language",
    ],
    expose_headers=["X-Request-ID"],
    max_age=3600,
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Prometheus metrics instrumentation
Instrumentator().instrument(app).expose(app)


@app.get("/", summary="Root")
async def root() -> dict[str, str]:
    return {"service": settings.APP_NAME, "status": "running"}
