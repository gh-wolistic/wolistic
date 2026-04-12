from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


# ── Partner Todos ─────────────────────────────────────────────────────────────

class PartnerActivityIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    priority: str = "medium"  # low | medium | high
    due_date: datetime | None = None


class PartnerActivityUpdateIn(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    status: str | None = None  # yet-to-start | in-progress | completed | rejected
    priority: str | None = None
    due_date: datetime | None = None


class PartnerActivityOut(BaseModel):
    id: int
    title: str
    description: str | None = None
    status: str
    priority: str
    due_date: datetime | None = None
    created_at: datetime


# ── Booking Board Items ───────────────────────────────────────────────────────

class BookingBoardItemOut(BaseModel):
    booking_reference: str
    client_name: str
    client_initials: str
    service_name: str
    scheduled_time: str | None = None   # "09:00 AM"
    scheduled_date: str | None = None   # ISO date string e.g. "2026-04-12"
    status: str                         # mapped frontend status (yet-to-start etc.)
    created_at: datetime


# ── Internal / Wolistic ───────────────────────────────────────────────────────

class InternalActivityOut(BaseModel):
    template_id: int
    title: str
    description: str | None = None
    category: str
    priority: str
    status: str  # yet-to-start | in-progress | completed | rejected


# ── Board Container ───────────────────────────────────────────────────────────

class ActivityBoardOut(BaseModel):
    todos: list[PartnerActivityOut] = []
    bookings: list[BookingBoardItemOut] = []
    internal: list[InternalActivityOut] = []


# ── Status updates ────────────────────────────────────────────────────────────

class BookingStatusUpdateIn(BaseModel):
    """Frontend status value: accepted | rejected | completed."""
    status: str


class InternalStatusUpdateIn(BaseModel):
    status: str  # yet-to-start | in-progress | completed | rejected


# ── Admin: template CRUD ──────────────────────────────────────────────────────

class WolisticTemplateIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    category: str = "Profile"
    priority: str = "medium"
    applies_to_subtype: str | None = None
    is_active: bool = True


class WolisticTemplateOut(BaseModel):
    id: int
    title: str
    description: str | None = None
    category: str
    priority: str
    applies_to_subtype: str | None = None
    is_active: bool
    created_at: datetime


class WolisticAssignmentOut(BaseModel):
    professional_id: str
    full_name: str | None = None
    email: str
    username: str | None = None
    status: str  # yet-to-start | in-progress | completed | rejected
