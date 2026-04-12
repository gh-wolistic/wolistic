from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


# ── Expert Client ─────────────────────────────────────────────────────────────

class ExpertClientIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=1, max_length=320)
    phone: str | None = Field(default=None, max_length=64)
    notes: str | None = None
    status: str = "active"  # active | inactive | blocked
    package_name: str | None = Field(default=None, max_length=255)


class ExpertClientUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: str | None = Field(default=None, min_length=1, max_length=320)
    phone: str | None = Field(default=None, max_length=64)
    notes: str | None = None
    status: str | None = None
    package_name: str | None = None


class ExpertClientOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None = None
    notes: str | None = None
    status: str
    package_name: str | None = None
    last_session_date: datetime | None = None
    next_session_date: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Follow-Ups ────────────────────────────────────────────────────────────────

class ExpertFollowUpIn(BaseModel):
    client_id: int
    note: str = Field(min_length=1)
    due_date: datetime


class ExpertFollowUpUpdateIn(BaseModel):
    note: str | None = Field(default=None, min_length=1)
    due_date: datetime | None = None
    resolved: bool | None = None


class ExpertFollowUpOut(BaseModel):
    id: int
    client_id: int
    client_name: str
    client_initials: str
    last_session_date: datetime | None = None
    note: str
    due_date: datetime
    resolved: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Leads ─────────────────────────────────────────────────────────────────────

class ExpertLeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=1, max_length=320)
    phone: str | None = Field(default=None, max_length=64)
    source: str = "direct"  # platform | referral | direct
    interest: str | None = None
    status: str = "new"  # new | contacted | converted | dropped
    enquiry_date: datetime | None = None


class ExpertLeadUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: str | None = Field(default=None, min_length=1, max_length=320)
    phone: str | None = Field(default=None, max_length=64)
    source: str | None = None
    interest: str | None = None
    status: str | None = None


class ExpertLeadOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None = None
    source: str
    interest: str | None = None
    status: str
    enquiry_date: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Aggregate list response ───────────────────────────────────────────────────

class ClientsBoardOut(BaseModel):
    clients: list[ExpertClientOut] = []
    follow_ups: list[ExpertFollowUpOut] = []
    leads: list[ExpertLeadOut] = []
