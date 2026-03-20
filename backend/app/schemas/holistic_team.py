from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class HolisticTeamProfessionalCard(BaseModel):
    id: UUID
    username: str
    name: str
    specialization: str
    image: str | None = None
    rating: float = 0
    review_count: int = 0


class HolisticTeamMemberOut(BaseModel):
    role: str
    sessions_included: int
    professional: HolisticTeamProfessionalCard


class HolisticTeamOut(BaseModel):
    id: UUID
    name: str | None = None
    source_type: str
    scope: str
    query_tag: str | None = None
    keywords: list[str] = Field(default_factory=list)
    pricing_amount: float
    pricing_currency: str
    mode: str
    sessions_included_total: int
    package_type: str
    members: list[HolisticTeamMemberOut]
    created_at: datetime


class HolisticTeamListResponse(BaseModel):
    items: list[HolisticTeamOut]


class HolisticTeamMemberIn(BaseModel):
    professional_id: UUID
    role: str = Field(default="other", min_length=2, max_length=20)
    sessions_included: int = Field(default=1, ge=1, le=50)


class CreateHolisticTeamIn(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    scope: str = Field(default="professionals", max_length=50)
    keywords: list[str] = Field(default_factory=list)
    mode: str = Field(default="online", max_length=20)
    package_type: str = Field(default="consultation_only", max_length=30)
    pricing_amount: float = Field(ge=0)
    pricing_currency: str = Field(default="INR", max_length=8)
    members: list[HolisticTeamMemberIn] = Field(default_factory=list)


class HolisticTeamBackfillResponse(BaseModel):
    created: int


class PrepareHolisticTeamIn(BaseModel):
    query: str = Field(min_length=1, max_length=300)
    scope: str = Field(default="professionals", max_length=50)
    preferred_mode: str | None = Field(default=None, max_length=20)
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, ge=0)


class PrepareHolisticTeamOut(BaseModel):
    prepared: bool
