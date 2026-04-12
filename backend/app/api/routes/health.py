from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session

router = APIRouter()


@router.get("/healthz", summary="Service liveness check")
async def health_liveness() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/readyz", summary="Service readiness check")
async def health_readiness(db: AsyncSession = Depends(get_db_session)) -> dict[str, str]:
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}


@router.get("/health", summary="Service health check", deprecated=True)
async def health_legacy() -> dict[str, str]:
    # Deprecated liveness alias — no DB check to avoid pgbouncer prepared-statement
    # collisions on container restart. Use /readyz for a DB-verified readiness check.
    return {"status": "ok"}
