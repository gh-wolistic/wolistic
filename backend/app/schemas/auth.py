from __future__ import annotations

import uuid
from typing import Literal

from pydantic import BaseModel


class AuthMeOut(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    user_type: Literal["professional", "user", "brand", "influencer", "unknown"] = "user"
    user_role: str | None = None