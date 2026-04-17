from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class PartnerDashboardOverviewOut(BaseModel):
    membership_tier: str | None = None
    specialization: str | None = None
    location: str | None = None
    languages_total: int = 0
    certifications_total: int = 0


class PartnerDashboardMetricsOut(BaseModel):
    services_total: int = 0
    active_services_total: int = 0
    availability_slots_total: int = 0
    booking_questions_total: int = 0
    bookings_total: int = 0
    upcoming_bookings_total: int = 0
    immediate_bookings_total: int = 0
    completed_bookings_total: int = 0
    holistic_teams_total: int = 0
    revenue_total: float = 0
    revenue_currency: str | None = None
    rating_avg: float = 0
    rating_count: int = 0
    upcoming_sessions_total: int = 0  # Group sessions (class_sessions)


class PartnerDashboardRecentReviewOut(BaseModel):
    id: int
    reviewer_name: str
    rating: int
    comment: str | None = None
    created_at: datetime


class PartnerActiveClientOut(BaseModel):
    client_user_id: str
    name: str
    initials: str
    last_session_at: datetime | None = None
    next_session_at: datetime | None = None
    status: str = "active"


class PartnerFollowUpOut(BaseModel):
    id: str  # Unique identifier for this follow-up
    client_user_id: str
    name: str
    initials: str
    last_session_at: datetime | None = None
    reason: str = "Check in after last session"
    due_date: datetime | None = None
    note: str | None = None
    is_overdue: bool = False
    is_manual: bool = False  # True if created manually, False if auto-generated


class TodaySessionOut(BaseModel):
    booking_reference: str
    client_name: str
    client_initials: str
    service_name: str
    scheduled_at: datetime | None = None
    is_immediate: bool = False
    status: str = "upcoming"


class PartnerDashboardOut(BaseModel):
    overview: PartnerDashboardOverviewOut
    metrics: PartnerDashboardMetricsOut
    recent_reviews: list[PartnerDashboardRecentReviewOut] = []
    active_clients: list[PartnerActiveClientOut] = []
    follow_ups: list[PartnerFollowUpOut] = []
    today_sessions: list[TodaySessionOut] = []
