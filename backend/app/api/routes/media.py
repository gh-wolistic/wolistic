from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from pathlib import PurePosixPath

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.media import MediaAsset
from app.models.user import User
from app.schemas.media import (
    MediaAssetOut,
    MediaConfirmIn,
    MediaDeleteOut,
    MediaUploadIntentIn,
    MediaUploadIntentOut,
)

router = APIRouter(prefix="/media", tags=["media"])

_ALLOWED_SURFACES = {"profile", "cover", "gallery", "feed"}
_ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
}
_BUCKET_SURFACES = {
    "wolistic-media-profile": {"profile", "cover"},
    "wolistic-media-feed": {"gallery", "feed"},
}
_MAX_SIZE_PROFILE_BYTES = 10 * 1024 * 1024
_MAX_SIZE_FEED_BYTES = 20 * 1024 * 1024


def _sanitize_extension(file_name: str, mime_type: str) -> str:
    suffix = PurePosixPath(file_name).suffix.lower().strip(".")
    if suffix and re.fullmatch(r"[a-z0-9]{2,8}", suffix):
        return suffix

    if mime_type == "image/jpeg" or mime_type == "image/jpg":
        return "jpg"
    if mime_type == "image/png":
        return "png"
    if mime_type == "image/webp":
        return "webp"
    if mime_type == "image/avif":
        return "avif"

    return "bin"


def _canonical_media_path(*, actor_type: str, user_id: uuid.UUID, surface: str, extension: str) -> str:
    now = datetime.now(timezone.utc)
    return f"{actor_type}/{user_id}/{surface}/{now:%Y}/{now:%m}/{uuid.uuid4()}.{extension}"


def _validate_surface_bucket(*, surface: str, bucket_id: str) -> None:
    if surface not in _ALLOWED_SURFACES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported media surface")

    allowed = _BUCKET_SURFACES.get(bucket_id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported media bucket")
    if surface not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Surface does not match selected bucket",
        )


def _validate_size_and_mime(*, surface: str, size_bytes: int, mime_type: str) -> None:
    normalized = mime_type.strip().lower()
    if normalized not in _ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image MIME type")

    max_size = _MAX_SIZE_PROFILE_BYTES if surface in {"profile", "cover"} else _MAX_SIZE_FEED_BYTES
    if size_bytes > max_size:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size exceeds policy limit")


def _validate_path_ownership(*, object_path: str, user_id: uuid.UUID) -> None:
    parts = [part for part in object_path.split("/") if part]
    if len(parts) < 4:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid media path")
    if parts[0] not in {"clients", "partners"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid actor segment in media path")
    if parts[1] != str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Media path ownership mismatch")


async def _resolve_actor_type(*, db: AsyncSession, user_id: uuid.UUID) -> str:
    result = await db.execute(select(User.user_type).where(User.id == user_id))
    user_type = result.scalar_one_or_none()
    return "partners" if user_type == "partner" else "clients"


@router.post("/upload-intent", response_model=MediaUploadIntentOut)
async def create_upload_intent(
    payload: MediaUploadIntentIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> MediaUploadIntentOut:
    surface = payload.surface.strip().lower()
    bucket_id = payload.bucket_id.strip().lower()
    mime_type = payload.mime_type.strip().lower()

    _validate_surface_bucket(surface=surface, bucket_id=bucket_id)
    _validate_size_and_mime(surface=surface, size_bytes=payload.size_bytes, mime_type=mime_type)

    actor_type = await _resolve_actor_type(db=db, user_id=current_user.user_id)
    extension = _sanitize_extension(payload.file_name, mime_type)
    object_path = _canonical_media_path(
        actor_type=actor_type,
        user_id=current_user.user_id,
        surface=surface,
        extension=extension,
    )

    return MediaUploadIntentOut(bucket_id=bucket_id, object_path=object_path, surface=surface)


@router.post("/confirm", response_model=MediaAssetOut)
async def confirm_upload(
    payload: MediaConfirmIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> MediaAssetOut:
    surface = payload.surface.strip().lower()
    bucket_id = payload.bucket_id.strip().lower()

    _validate_surface_bucket(surface=surface, bucket_id=bucket_id)
    if payload.size_bytes and payload.mime_type:
        _validate_size_and_mime(
            surface=surface,
            size_bytes=payload.size_bytes,
            mime_type=payload.mime_type,
        )
    _validate_path_ownership(object_path=payload.object_path, user_id=current_user.user_id)

    existing_result = await db.execute(
        select(MediaAsset).where(
            MediaAsset.bucket_id == bucket_id,
            MediaAsset.object_path == payload.object_path,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing and existing.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Media object already tracked by another user")

    if existing:
        existing.surface = surface
        existing.mime_type = payload.mime_type
        existing.size_bytes = payload.size_bytes
        existing.width = payload.width
        existing.height = payload.height
        existing.source_url = payload.source_url
        existing.deleted_at = None
        await db.commit()
        await db.refresh(existing)
        return MediaAssetOut(
            id=existing.id,
            bucket_id=existing.bucket_id,
            object_path=existing.object_path,
            surface=existing.surface,
            mime_type=existing.mime_type,
            size_bytes=existing.size_bytes,
            width=existing.width,
            height=existing.height,
            source_url=existing.source_url,
        )

    media = MediaAsset(
        owner_user_id=current_user.user_id,
        bucket_id=bucket_id,
        object_path=payload.object_path,
        surface=surface,
        mime_type=payload.mime_type,
        size_bytes=payload.size_bytes,
        width=payload.width,
        height=payload.height,
        source_url=payload.source_url,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)

    return MediaAssetOut(
        id=media.id,
        bucket_id=media.bucket_id,
        object_path=media.object_path,
        surface=media.surface,
        mime_type=media.mime_type,
        size_bytes=media.size_bytes,
        width=media.width,
        height=media.height,
        source_url=media.source_url,
    )


@router.get("/my", response_model=list[MediaAssetOut])
async def list_my_media_assets(
    surface: str | None = Query(default=None),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[MediaAssetOut]:
    filters = [
        MediaAsset.owner_user_id == current_user.user_id,
        MediaAsset.deleted_at.is_(None),
    ]

    normalized_surface = surface.strip().lower() if surface else None
    if normalized_surface:
        filters.append(MediaAsset.surface == normalized_surface)

    result = await db.execute(
        select(MediaAsset)
        .where(and_(*filters))
        .order_by(MediaAsset.created_at.desc())
    )
    rows = result.scalars().all()

    return [
        MediaAssetOut(
            id=row.id,
            bucket_id=row.bucket_id,
            object_path=row.object_path,
            surface=row.surface,
            mime_type=row.mime_type,
            size_bytes=row.size_bytes,
            width=row.width,
            height=row.height,
            source_url=row.source_url,
        )
        for row in rows
    ]


@router.delete("/{media_id}", response_model=MediaDeleteOut)
async def delete_media_asset(
    media_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> MediaDeleteOut:
    result = await db.execute(
        select(MediaAsset).where(
            MediaAsset.id == media_id,
            MediaAsset.owner_user_id == current_user.user_id,
            MediaAsset.deleted_at.is_(None),
        )
    )
    media = result.scalar_one_or_none()
    if media is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found")

    media.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    return MediaDeleteOut(ok=True, id=media.id)
