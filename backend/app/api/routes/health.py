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
async def health_legacy(db: AsyncSession = Depends(get_db_session)) -> dict[str, str]:
    # Backward-compatible alias for previous health route behavior.
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}
