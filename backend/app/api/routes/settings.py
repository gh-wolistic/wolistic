from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.professional import Professional
from app.models.settings import ProfessionalSettings
from app.schemas.settings import (
    AccountSettingsIn,
    NotificationsSettingsIn,
    PrivacySettingsIn,
    SettingsOut,
)

router = APIRouter(prefix="/partners/settings", tags=["settings"])

_DEFAULT_NOTIFICATIONS = {
    "newBooking": {"email": True, "inApp": True},
    "sessionReminder": {"email": True, "inApp": True},
    "reviewReceived": {"email": True, "inApp": True},
    "followUpDue": {"email": True, "inApp": True},
    "paymentReceived": {"email": True, "inApp": False},
    "coinReward": {"email": False, "inApp": True},
    "platformTips": {"email": False, "inApp": False},
}

_DEFAULT_PRIVACY = {
    "profileVisible": True,
    "showInSearch": True,
    "allowMessages": True,
    "shareActivityData": False,
}


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _require_professional(
    current_user: AuthenticatedUser,
    db: AsyncSession,
) -> Professional:
    result = await db.execute(
        select(Professional).where(Professional.user_id == current_user.user_id)
    )
    professional = result.scalar_one_or_none()
    if professional is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professional profile not found",
        )
    return professional


async def _get_or_create_settings(
    professional: Professional,
    db: AsyncSession,
) -> ProfessionalSettings:
    result = await db.execute(
        select(ProfessionalSettings).where(
            ProfessionalSettings.professional_id == professional.user_id
        )
    )
    row = result.scalar_one_or_none()
    if row is None:
        row = ProfessionalSettings(
            professional_id=professional.user_id,
            display_name=None,
            timezone="Asia/Kolkata",
            language="EN",
            notifications=_DEFAULT_NOTIFICATIONS,
            weekly_digest=True,
            privacy=_DEFAULT_PRIVACY,
        )
        db.add(row)
        await db.commit()
        await db.refresh(row)
    return row


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=SettingsOut)
async def get_settings(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> SettingsOut:
    professional = await _require_professional(current_user, db)
    row = await _get_or_create_settings(professional, db)
    return SettingsOut.model_validate(row)


@router.patch("/account", response_model=SettingsOut)
async def update_account_settings(
    payload: AccountSettingsIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> SettingsOut:
    professional = await _require_professional(current_user, db)
    row = await _get_or_create_settings(professional, db)
    if payload.display_name is not None:
        row.display_name = payload.display_name
    row.timezone = payload.timezone
    row.language = payload.language
    await db.commit()
    await db.refresh(row)
    return SettingsOut.model_validate(row)


@router.patch("/notifications", response_model=SettingsOut)
async def update_notifications(
    payload: NotificationsSettingsIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> SettingsOut:
    professional = await _require_professional(current_user, db)
    row = await _get_or_create_settings(professional, db)
    row.notifications = payload.notifications
    row.weekly_digest = payload.weekly_digest
    await db.commit()
    await db.refresh(row)
    return SettingsOut.model_validate(row)


@router.patch("/privacy", response_model=SettingsOut)
async def update_privacy(
    payload: PrivacySettingsIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> SettingsOut:
    professional = await _require_professional(current_user, db)
    row = await _get_or_create_settings(professional, db)
    row.privacy = payload.privacy
    await db.commit()
    await db.refresh(row)
    return SettingsOut.model_validate(row)


@router.post("/export", status_code=status.HTTP_202_ACCEPTED)
async def request_data_export(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    await _require_professional(current_user, db)
    # In a real system this would enqueue a background job.
    return {"detail": "Export request received. You will receive an email within 24 hours."}


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    professional = await _require_professional(current_user, db)
    # Soft-delete: mark professional as inactive. Hard deletion would cascade.
    professional.is_active = False  # type: ignore[assignment]
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
