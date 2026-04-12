"""Pydantic response schemas for the professionals API."""

from __future__ import annotations

import uuid
from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, Field


class ServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    duration: str
    mode: str
    price: int
    offers: str | None = None
    negotiable: bool = False
    offer_type: str | None = None
    offer_value: int | None = None
    offer_label: str | None = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reviewer_name: str
    rating: int
    comment: str | None = None
    created_at: str


class CertificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    issuer: str | None = None
    issued_year: int | None = None


class ServiceAreaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    city_name: str
    latitude: float | None = None
    longitude: float | None = None
    radius_km: int = 300
    is_primary: bool = False


class ApproachOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    description: str | None = None


class ExpertiseAreaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    description: str | None = None


class ProfessionalProfileOut(BaseModel):
    """Full professional profile returned by GET /professionals/{username}."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    name: str
    specialization: str
    category: str | None = None
    location: str | None = None
    image: str | None = None
    cover_image: str | None = None
    rating: float = 0
    review_count: int = 0
    experience: str | None = None
    experience_years: int = 0
    short_bio: str | None = None
    about: str | None = None
    membership_tier: str | None = None
    profile_completeness: int = 0
    is_online: bool = False
    placement_label: str | None = None

    # Extended fields
    pronouns: str | None = None
    who_i_work_with: str | None = None
    client_goals: list[str] = []
    response_time_hours: int = 24
    cancellation_hours: int = 24
    social_links: dict = {}
    video_intro_url: str | None = None

    # Structured child data
    approaches: list[ApproachOut] = []
    # Legacy flattened approach string kept for search ranking compatibility
    approach: str | None = None
    availability: str | None = None
    certifications: list[CertificationOut] = []
    expertise_areas: list[ExpertiseAreaOut] = []
    # Legacy flat specializations list kept for search/featured compatibility
    specializations: list[str] = []
    education: list[str] = []
    languages: list[str] = []
    session_types: list[str] = []
    subcategories: list[str] = []
    gallery: list[str] = []
    services: list[ServiceOut] = []
    service_areas: list[ServiceAreaOut] = []
    featured_products: list[dict] = []


class PublishProfileOut(BaseModel):
    """Response returned after publishing a draft profile."""

    ok: bool = True
    message: str = "Profile published successfully."


class ProfessionalUsernameOut(BaseModel):
    """Minimal response for UUID → username redirect."""

    username: str


class ReviewPageOut(BaseModel):
    """Paginated reviews response."""

    items: list[ReviewOut]
    total: int


class ProfessionalApproachIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)


class ProfessionalAvailabilityIn(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    timezone: str = Field(min_length=2, max_length=100)


class ProfessionalCertificationIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    issuer: str | None = Field(default=None, max_length=255)
    issued_year: int | None = Field(default=None, ge=1900, le=2100)


class ProfessionalExpertiseAreaIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)


class ProfessionalGalleryIn(BaseModel):
    image_url: str = Field(min_length=1, max_length=4000)
    caption: str | None = Field(default=None, max_length=255)
    display_order: int = Field(default=0, ge=0, le=500)


class ProfessionalServiceIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    short_brief: str | None = Field(default=None, max_length=255)
    price: float = Field(ge=0)
    offers: str | None = Field(default=None, max_length=255)
    negotiable: bool = False
    offer_type: str = Field(default="none", min_length=2, max_length=20)
    offer_value: int | None = Field(default=None, ge=0)
    offer_label: str | None = Field(default=None, max_length=100)
    offer_starts_at: datetime | None = None
    offer_ends_at: datetime | None = None
    mode: str = Field(min_length=1, max_length=64)
    duration_value: int = Field(ge=1, le=1440)
    duration_unit: str = Field(min_length=1, max_length=32)
    max_participants: int | None = Field(default=None, ge=1, le=10000)
    is_active: bool = True


class ProfessionalServiceAreaIn(BaseModel):
    city_name: str = Field(min_length=1, max_length=255)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    radius_km: int = Field(default=300, ge=1, le=3000)
    is_primary: bool = False


class BookingQuestionTemplateIn(BaseModel):
    prompt: str = Field(min_length=1, max_length=4000)
    question_type: str = Field(default="text", pattern="^(text|scale|choice)$")
    display_order: int = Field(default=1, ge=1, le=20)
    is_required: bool = True
    is_active: bool = True


class ProfessionalEditorPayload(BaseModel):
    username: str = Field(min_length=2, max_length=100)
    cover_image_url: str | None = None
    profile_image_url: str | None = None
    specialization: str = Field(min_length=1, max_length=255)
    membership_tier: str | None = Field(default=None, max_length=64)
    experience_years: int = Field(default=0, ge=0, le=80)
    location: str | None = Field(default=None, max_length=255)
    sex: str = Field(default="undisclosed", min_length=2, max_length=32)
    short_bio: str | None = Field(default=None, max_length=255)
    about: str | None = Field(default=None, max_length=10000)

    # Extended fields
    pronouns: str | None = Field(default=None, max_length=64)
    who_i_work_with: str | None = Field(default=None, max_length=5000)
    client_goals: list[str] = []
    response_time_hours: int = Field(default=24, ge=1, le=720)
    cancellation_hours: int = Field(default=24, ge=0, le=720)
    social_links: dict = {}
    video_intro_url: str | None = Field(default=None, max_length=4000)
    default_timezone: str = Field(default="UTC", max_length=100)

    approaches: list[ProfessionalApproachIn] = []
    availability_slots: list[ProfessionalAvailabilityIn] = []
    certifications: list[ProfessionalCertificationIn] = []
    education: list[str] = []
    expertise_areas: list[ProfessionalExpertiseAreaIn] = []
    gallery: list[ProfessionalGalleryIn] = []
    languages: list[str] = []
    session_types: list[str] = []
    subcategories: list[str] = []
    services: list[ProfessionalServiceIn] = []
    service_areas: list[ProfessionalServiceAreaIn] = []
    booking_question_templates: list[BookingQuestionTemplateIn] = []


class ProfessionalEditorOut(ProfessionalEditorPayload):
    professional_id: uuid.UUID
