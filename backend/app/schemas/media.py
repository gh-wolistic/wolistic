from __future__ import annotations

import uuid

from pydantic import BaseModel, Field


class MediaUploadIntentIn(BaseModel):
    bucket_id: str = Field(min_length=3, max_length=128)
    surface: str = Field(min_length=3, max_length=32)
    file_name: str = Field(min_length=1, max_length=255)
    mime_type: str = Field(min_length=3, max_length=127)
    size_bytes: int = Field(ge=1, le=25_000_000)


class MediaUploadIntentOut(BaseModel):
    bucket_id: str
    object_path: str
    surface: str


class MediaConfirmIn(BaseModel):
    bucket_id: str = Field(min_length=3, max_length=128)
    object_path: str = Field(min_length=5, max_length=4000)
    surface: str = Field(min_length=3, max_length=32)
    mime_type: str | None = Field(default=None, max_length=127)
    size_bytes: int | None = Field(default=None, ge=1, le=25_000_000)
    width: int | None = Field(default=None, ge=1, le=10000)
    height: int | None = Field(default=None, ge=1, le=10000)
    source_url: str | None = Field(default=None, max_length=4000)


class MediaAssetOut(BaseModel):
    id: uuid.UUID
    bucket_id: str
    object_path: str
    surface: str
    mime_type: str | None = None
    size_bytes: int | None = None
    width: int | None = None
    height: int | None = None
    source_url: str | None = None


class MediaDeleteOut(BaseModel):
    ok: bool = True
    id: uuid.UUID
