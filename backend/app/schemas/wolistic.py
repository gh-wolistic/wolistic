"""Pydantic schemas for AI / Wolistic search responses."""

from __future__ import annotations

import uuid

from pydantic import BaseModel

from app.schemas.professional import ProfessionalProfileOut


class ProductOut(BaseModel):
    id: uuid.UUID
    name: str
    image: str | None = None
    category: str | None = None
    brand: str | None = None
    description: str | None = None
    price: int = 0


class WolisticServiceOut(BaseModel):
    id: uuid.UUID
    title: str
    type: str
    location: str


class WolisticArticleOut(BaseModel):
    id: uuid.UUID
    title: str
    read_time: str


class WolisticSearchResponse(BaseModel):
    professionals: list[ProfessionalProfileOut] = []
    products: list[ProductOut] = []
    services: list[WolisticServiceOut] = []
    articles: list[WolisticArticleOut] = []
