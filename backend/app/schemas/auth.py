from __future__ import annotations

import uuid
from typing import Literal

from pydantic import BaseModel, model_validator

UserType = Literal["client", "partner"]
UserSubtype = Literal[
    "client",
    "body_expert",
    "mind_expert",
    "diet_expert",
    "mutiple_roles",
    "brand",
    "influencer",
]


class AuthMeOut(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    user_type: UserType | None = None
    user_subtype: UserSubtype | None = None
    user_role: str | None = None
    onboarding_required: bool = True


class UpdateOnboardingIn(BaseModel):
    user_type: UserType
    user_subtype: UserSubtype

    @model_validator(mode="after")
    def validate_selection(self) -> "UpdateOnboardingIn":
        if self.user_type == "client" and self.user_subtype != "client":
            raise ValueError("Client users must use the client subtype")

        if self.user_type == "partner" and self.user_subtype == "client":
            raise ValueError("Partner users must choose a partner subtype")

        return self