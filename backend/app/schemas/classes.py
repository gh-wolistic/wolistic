from __future__ import annotations

from datetime import date, time, datetime
from typing import List

from pydantic import BaseModel, Field


# ── Work Locations ────────────────────────────────────────────────────────────

class WorkLocationIn(BaseModel):
    name: str = Field(..., max_length=255)
    address: str | None = Field(None, max_length=500)
    location_type: str = Field("gym", max_length=32)


class WorkLocationOut(BaseModel):
    id: int
    name: str
    address: str | None
    location_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Group Classes ─────────────────────────────────────────────────────────────

class GroupClassIn(BaseModel):
    title: str = Field(..., max_length=255)
    category: str = Field("other", max_length=32)
    status: str = Field("draft", max_length=16)
    duration_minutes: int = Field(60, ge=1)
    capacity: int = Field(20, ge=1)
    price: float = Field(0.0, ge=0)
    description: str | None = None
    work_location_id: int | None = None


class GroupClassPatch(BaseModel):
    title: str | None = Field(None, max_length=255)
    category: str | None = Field(None, max_length=32)
    status: str | None = Field(None, max_length=16)
    duration_minutes: int | None = Field(None, ge=1)
    capacity: int | None = Field(None, ge=1)
    price: float | None = Field(None, ge=0)
    description: str | None = None
    work_location_id: int | None = None


class SessionScheduleOut(BaseModel):
    id: int
    session_date: date
    start_time: time
    enrolled_count: int = 0

    model_config = {"from_attributes": True}


class GroupClassOut(BaseModel):
    id: int
    title: str
    category: str
    status: str
    duration_minutes: int
    capacity: int
    price: float
    description: str | None
    work_location_id: int | None
    work_location_name: str | None
    upcoming_sessions: List[SessionScheduleOut] = []
    enrolled_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Class Sessions ────────────────────────────────────────────────────────────

class ClassSessionIn(BaseModel):
    session_date: date
    start_time: time


class ClassSessionOut(BaseModel):
    id: int
    group_class_id: int
    session_date: date
    start_time: time
    enrolled_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Class Enrollments ─────────────────────────────────────────────────────────

class ClassEnrollmentIn(BaseModel):
    client_name: str = Field(..., max_length=255)
    expert_client_id: int | None = None
    status: str = Field("confirmed", max_length=16)
    payment_status: str = Field("pending", max_length=16)


class ClassEnrollmentPatch(BaseModel):
    status: str | None = Field(None, max_length=16)
    payment_status: str | None = Field(None, max_length=16)


class ClassEnrollmentOut(BaseModel):
    id: int
    class_session_id: int
    expert_client_id: int | None
    client_name: str
    status: str
    payment_status: str
    # denormalised from the session/class join
    class_title: str | None = None
    session_date: date | None = None
    start_time: time | None = None
    work_location_name: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
