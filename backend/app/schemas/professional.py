"""Pydantic response schemas for the professionals API."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


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
    is_online: bool = False

    # Flattened child data
    approach: str | None = None
    availability: str | None = None
    certifications: list[CertificationOut] = []
    specializations: list[str] = []
    education: list[str] = []
    languages: list[str] = []
    session_types: list[str] = []
    subcategories: list[str] = []
    gallery: list[str] = []
    services: list[ServiceOut] = []
    featured_products: list[dict] = []


class ProfessionalUsernameOut(BaseModel):
    """Minimal response for UUID → username redirect."""

    username: str


class ReviewPageOut(BaseModel):
    """Paginated reviews response."""

    items: list[ReviewOut]
    total: int
