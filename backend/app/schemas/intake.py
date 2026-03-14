from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ExpertReviewAnswers(BaseModel):
    goal: str | None = None
    challenge: str | None = None
    time_commitment: str | None = None
    budget_range: str | None = None
    preferred_mode: str | None = None


class ExpertReviewSubmission(BaseModel):
    query: str | None = None
    scope: str | None = "professionals"
    answers: ExpertReviewAnswers = Field(default_factory=ExpertReviewAnswers)
    source: str | None = "expert_review_chat"
    metadata: dict[str, Any] = Field(default_factory=dict)


class ExpertReviewResponse(BaseModel):
    id: UUID
    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }
