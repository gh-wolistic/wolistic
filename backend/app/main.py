import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.router import api_router
from app.core.config import get_settings
from app.core.middleware import RequestIDMiddleware
from app.core.logging_config import setup_logging

settings = get_settings()

# Configure logging based on environment
setup_logging()

app = FastAPI(title=settings.APP_NAME)

logger = logging.getLogger(__name__)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Log and return validation errors with details."""
    logger.error(
        f"Validation error on {request.method} {request.url.path}: {exc.errors()}",
        extra={"body": await request.body() if request.method in ["POST", "PUT", "PATCH"] else None}
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch all unhandled exceptions and log them."""
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {type(exc).__name__}: {exc}",
        exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


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
