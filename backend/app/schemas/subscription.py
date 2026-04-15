from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, model_validator


# ── Plans ─────────────────────────────────────────────────────────────────────

class SubscriptionPlanOut(BaseModel):
    id: int
    expert_type: str
    name: str
    tier: str
    description: str | None
    price_monthly: float
    price_yearly: float | None
    features: list[str]
    limits: dict[str, Any]
    display_order: int
    is_active: bool
    coming_soon: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionPlanIn(BaseModel):
    expert_type: str = Field("all", max_length=32)
    name: str = Field(..., max_length=100)
    tier: str = Field("free", max_length=32)
    description: str | None = None
    price_monthly: float = Field(0.0, ge=0)
    price_yearly: float | None = Field(None, ge=0)
    features: list[str] = Field(default_factory=list)
    limits: dict[str, Any] = Field(default_factory=dict)
    display_order: int = Field(0, ge=0)
    is_active: bool = True
    coming_soon: bool = False


class SubscriptionPlanPatch(BaseModel):
    expert_type: str | None = Field(None, max_length=32)
    name: str | None = Field(None, max_length=100)
    tier: str | None = Field(None, max_length=32)
    description: str | None = None
    price_monthly: float | None = Field(None, ge=0)
    price_yearly: float | None = Field(None, ge=0)
    features: list[str] | None = None
    limits: dict[str, Any] | None = None
    display_order: int | None = Field(None, ge=0)
    is_active: bool | None = None
    coming_soon: bool | None = None


# ── Professional Subscriptions ────────────────────────────────────────────────

class ProfessionalSubscriptionOut(BaseModel):
    id: int
    professional_id: str
    plan_id: int
    plan: SubscriptionPlanOut
    status: str
    starts_at: datetime
    ends_at: datetime | None
    auto_renew: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfessionalSubscriptionAssign(BaseModel):
    """Admin assigns a plan to a professional by professional_id (UUID string)."""
    professional_id: str
    plan_id: int
    status: str = Field("active", max_length=32)
    starts_at: datetime
    ends_at: datetime | None = None
    auto_renew: bool = False
    
    @model_validator(mode='after')
    def validate_dates(self) -> 'ProfessionalSubscriptionAssign':
        """Validate that ends_at is after starts_at if provided."""
        if self.ends_at is not None and self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be after starts_at")
        return self


class ProfessionalSubscriptionPatch(BaseModel):
    plan_id: int | None = None
    status: str | None = Field(None, max_length=32)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    auto_renew: bool | None = None


# ── Billing Records ───────────────────────────────────────────────────────────

class BillingRecordOut(BaseModel):
    id: int
    professional_id: str
    plan_id: int
    plan_name: str
    amount: float
    currency: str
    method: str | None
    invoice_ref: str | None
    paid_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class BillingRecordIn(BaseModel):
    professional_id: str
    plan_id: int
    amount: float = Field(..., ge=0)
    currency: str = Field("INR", max_length=8)
    method: str | None = Field(None, max_length=64)
    invoice_ref: str | None = Field(None, max_length=255)
    paid_at: datetime


# ── Expert-facing read model ──────────────────────────────────────────────────

class MySubscriptionOut(BaseModel):
    """What the expert sees on their own subscription page."""
    subscription: ProfessionalSubscriptionOut | None
    billing_history: list[BillingRecordOut]
    available_plans: list[SubscriptionPlanOut]


# ── Upgrade payment ───────────────────────────────────────────────────────────

class UpgradeOrderIn(BaseModel):
    plan_id: int


class UpgradeOrderOut(BaseModel):
    key_id: str
    order_id: str
    amount_subunits: int
    currency: str
    plan_id: int
    plan_name: str


class UpgradeVerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: int


class UpgradeVerifyOut(BaseModel):
    status: str  # "success" | "failure"
    message: str


# ── Priority ticket ───────────────────────────────────────────────────────────

class PriorityTicketIn(BaseModel):
    plan_id: int
    message: str | None = None


class PriorityTicketOut(BaseModel):
    id: int
    plan_id: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
