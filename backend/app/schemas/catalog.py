from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CatalogProductOut(BaseModel):
    id: UUID
    slug: str
    name: str
    image_url: str | None = None
    category: str | None = None
    description: str | None = None
    brand_id: UUID
    brand_name: str
    brand_slug: str
    price: int
    rating: float = 0
    external_url: str | None = None
    is_featured: bool = False


class CatalogBrandSummaryOut(BaseModel):
    id: UUID
    slug: str
    name: str
    logo_url: str | None = None
    hero_image_url: str | None = None
    product_count: int = 0
    avg_rating: float = 0
    min_price: int = 0
    max_price: int = 0
    categories: list[str] = Field(default_factory=list)


class CatalogBrandDetailOut(BaseModel):
    id: UUID
    slug: str
    name: str
    logo_url: str | None = None
    hero_image_url: str | None = None
    website_url: str | None = None
    description: str | None = None
    products: list[CatalogProductOut] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)
    avg_rating: float = 0
    min_price: int = 0
    max_price: int = 0


class CatalogServiceOut(BaseModel):
    id: UUID
    slug: str
    name: str
    image_url: str | None = None
    service_type: str | None = None
    accreditation_body: str | None = None
    location: str | None = None
    eligibility: str | None = None
    duration: str | None = None
    delivery_format: str | None = None
    fees: str | None = None
    verification_method: str | None = None
    focus_areas: list[str] = Field(default_factory=list)
    apply_url: str | None = None
    description: str | None = None


class CatalogInfluencerOut(BaseModel):
    id: UUID
    slug: str
    name: str
    image_url: str | None = None
    focus: str | None = None
    follower_count: int = 0
    content_summary: str | None = None
    profile_url: str | None = None
    created_at: datetime | None = None