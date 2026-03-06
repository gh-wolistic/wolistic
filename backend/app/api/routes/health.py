from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session

router = APIRouter()


@router.get("/health", summary="Service health check")
async def health_check(db: AsyncSession = Depends(get_db_session)) -> dict[str, str]:
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}
