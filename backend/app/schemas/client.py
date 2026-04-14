from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


# ── Expert Client ─────────────────────────────────────────────────────────────

class ExpertClientIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=1, max_length=320)
    phone: str | None = Field(default=None, max_length=64)
    notes: str | None = None
    status: str = "active"  # active | paused | archived
    package_name: str | None = Field(default=None, max_length=255)
    acquisition_source: str = "expert_invite"
    goals: str | None = None
    preferences: str | None = None
    medical_history: str | None = None
    dietary_requirements: str | None = None
    age: int | None = None
    height_cm: int | None = None
    weight_kg: Decimal | None = None


class ExpertClientUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: str | None = Field(default=None, min_length=1, max_length=320)
    phone: str | None = Field(default=None, max_length=64)
    notes: str | None = None
    status: str | None = None
    package_name: str | None = None
    goals: str | None = None
    preferences: str | None = None
    medical_history: str | None = None
    dietary_requirements: str | None = None
    age: int | None = None
    height_cm: int | None = None
    weight_kg: Decimal | None = None


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
    
    # New client management fields
    acquisition_source: str
    source_metadata: dict | None = None
    enrolled_date: datetime
    total_sessions: int
    completed_sessions: int
    attendance_count: int
    current_streak_weeks: int
    lifetime_value: Decimal
    goals: str | None = None
    preferences: str | None = None
    medical_history: str | None = None
    dietary_requirements: str | None = None
    age: int | None = None
    height_cm: int | None = None
    weight_kg: Decimal | None = None

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


# ── Routines ──────────────────────────────────────────────────────────────────

class RoutineItemIn(BaseModel):
    item_type: str  # exercise | hydration | mobility | meal
    order: int
    title: str = Field(min_length=1, max_length=200)
    instructions: str | None = None
    sets: int | None = None
    reps: int | None = None
    rest_seconds: int | None = None
    intensity: str | None = None  # light | moderate | intense
    meal_type: str | None = None  # breakfast | lunch | dinner | snack
    calories: int | None = None


class RoutineItemUpdateIn(BaseModel):
    item_type: str | None = None
    order: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    instructions: str | None = None
    sets: int | None = None
    reps: int | None = None
    rest_seconds: int | None = None
    intensity: str | None = None
    meal_type: str | None = None
    calories: int | None = None
    completed: bool | None = None


class RoutineItemOut(BaseModel):
    id: int
    routine_id: int
    item_type: str
    order: int
    title: str
    instructions: str | None = None
    sets: int | None = None
    reps: int | None = None
    rest_seconds: int | None = None
    intensity: str | None = None
    meal_type: str | None = None
    calories: int | None = None
    completed: bool
    completed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RoutineIn(BaseModel):
    client_id: int | None = None  # None if template
    title: str = Field(min_length=1, max_length=200)
    description: str
    status: str = "draft"  # draft | under_review | approved | published | archived
    source_type: str = "manual"  # manual | ai_generated
    is_template: bool = False
    template_id: int | None = None  # If creating from template
    duration_weeks: int = Field(default=4, ge=1)
    items: list[RoutineItemIn] = []


class RoutineUpdateIn(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: str | None = None
    current_week: int | None = Field(default=None, ge=1)


class RoutineOut(BaseModel):
    id: int
    professional_id: str  # UUID
    client_id: int | None = None
    title: str
    description: str
    status: str
    source_type: str
    is_template: bool
    template_id: int | None = None
    duration_weeks: int
    current_week: int
    items: list[RoutineItemOut] = []
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None = None
    approved_at: datetime | None = None

    model_config = {"from_attributes": True}


# ── Dashboard Metrics ─────────────────────────────────────────────────────────

class DashboardMetricsOut(BaseModel):
    total_clients: int
    active_clients: int
    followups_due: int
    leads_pending: int
