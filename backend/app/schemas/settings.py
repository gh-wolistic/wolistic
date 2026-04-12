from __future__ import annotations

from typing import Any, Dict

from pydantic import BaseModel, Field


class SettingsOut(BaseModel):
    display_name: str | None
    timezone: str
    language: str
    notifications: Dict[str, Any]
    weekly_digest: bool
    privacy: Dict[str, Any]

    model_config = {"from_attributes": True}


class AccountSettingsIn(BaseModel):
    display_name: str | None = Field(None, max_length=255)
    timezone: str = Field("Asia/Kolkata", max_length=100)
    language: str = Field("EN", max_length=10)


class NotificationsSettingsIn(BaseModel):
    notifications: Dict[str, Any]
    weekly_digest: bool = True


class PrivacySettingsIn(BaseModel):
    privacy: Dict[str, Any]
