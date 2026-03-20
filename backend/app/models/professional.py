import uuid
from datetime import datetime, time

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    Time,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


# ---------------------------------------------------------------------------
# Main table – PK is user_id (FK → users.id)
# ---------------------------------------------------------------------------

class Professional(Base):
    __tablename__ = "professionals"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    cover_image_url: Mapped[str | None] = mapped_column(Text)
    profile_image_url: Mapped[str | None] = mapped_column(Text)
    specialization: Mapped[str] = mapped_column(String, nullable=False)
    membership_tier: Mapped[str | None] = mapped_column(String)
    experience_years: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    location: Mapped[str | None] = mapped_column(String)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6))
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6))
    sex: Mapped[str] = mapped_column(String, nullable=False, server_default="undisclosed")
    short_bio: Mapped[str | None] = mapped_column(String)
    about: Mapped[str | None] = mapped_column(Text)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_online: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    rating_avg: Mapped[float] = mapped_column(Numeric, nullable=False, server_default="0")
    rating_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", lazy="joined")
    approaches: Mapped[list["ProfessionalApproach"]] = relationship(
        back_populates="professional", lazy="selectin"
    )
    availability_slots: Mapped[list["ProfessionalAvailability"]] = relationship(
        back_populates="professional", lazy="selectin"
    )
    certifications: Mapped[list["ProfessionalCertification"]] = relationship(
        back_populates="professional", lazy="selectin"
    )
    # Some environments do not yet have professional_education; keep this noload
    # so profile fetches don't fail when the table is absent.
    education_items: Mapped[list["ProfessionalEducation"]] = relationship(
        back_populates="professional", lazy="noload"
    )
    expertise_areas: Mapped[list["ProfessionalExpertiseArea"]] = relationship(
        back_populates="professional", lazy="selectin"
    )
    gallery: Mapped[list["ProfessionalGallery"]] = relationship(
        back_populates="professional", lazy="selectin"
    )
    languages: Mapped[list["ProfessionalLanguage"]] = relationship(
        back_populates="professional", lazy="selectin"
    )
    reviews: Mapped[list["ProfessionalReview"]] = relationship(
        back_populates="professional", lazy="noload"
    )
    services: Mapped[list["ProfessionalService"]] = relationship(
        back_populates="professional", lazy="selectin"
    )
    session_types: Mapped[list["ProfessionalSessionType"]] = relationship(
        back_populates="professional", lazy="selectin"
    )
    subcategories: Mapped[list["ProfessionalSubcategory"]] = relationship(
        back_populates="professional", lazy="selectin"
    )
    service_areas: Mapped[list["ProfessionalServiceArea"]] = relationship(
        back_populates="professional", lazy="selectin"
    )


# ---------------------------------------------------------------------------
# Child tables – bigint IDENTITY PK, FK → professionals.user_id
# ---------------------------------------------------------------------------

class ProfessionalApproach(Base):
    __tablename__ = "professional_approaches"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    professional: Mapped["Professional"] = relationship(back_populates="approaches")


class ProfessionalAvailability(Base):
    __tablename__ = "professional_availability"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    day_of_week: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    timezone: Mapped[str] = mapped_column(String, nullable=False)

    professional: Mapped["Professional"] = relationship(back_populates="availability_slots")


class ProfessionalCertification(Base):
    __tablename__ = "professional_certifications"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    issuer: Mapped[str | None] = mapped_column(String)
    issued_year: Mapped[int | None] = mapped_column(Integer)

    professional: Mapped["Professional"] = relationship(back_populates="certifications")


class ProfessionalEducation(Base):
    __tablename__ = "professional_education"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    education: Mapped[str] = mapped_column(Text, nullable=False)

    professional: Mapped["Professional"] = relationship(back_populates="education_items")


class ProfessionalExpertiseArea(Base):
    __tablename__ = "professional_expertise_areas"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    professional: Mapped["Professional"] = relationship(back_populates="expertise_areas")


class ProfessionalGallery(Base):
    __tablename__ = "professional_gallery"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    caption: Mapped[str | None] = mapped_column(String)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    professional: Mapped["Professional"] = relationship(back_populates="gallery")


class ProfessionalLanguage(Base):
    __tablename__ = "professional_languages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    language: Mapped[str] = mapped_column(String, nullable=False)

    professional: Mapped["Professional"] = relationship(back_populates="languages")


class ProfessionalReview(Base):
    __tablename__ = "professional_reviews"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    reviewer_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    review_text: Mapped[str | None] = mapped_column(Text)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    professional: Mapped["Professional"] = relationship(back_populates="reviews")
    reviewer: Mapped["User"] = relationship(
        "User", foreign_keys=[reviewer_user_id], lazy="joined"
    )


class ProfessionalService(Base):
    __tablename__ = "professional_services"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    short_brief: Mapped[str | None] = mapped_column(String)
    price: Mapped[float] = mapped_column(Numeric, nullable=False)
    offers: Mapped[str | None] = mapped_column(String)
    negotiable: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    offer_type: Mapped[str] = mapped_column(String(20), nullable=False, server_default="none")
    offer_value: Mapped[int | None] = mapped_column(Integer)
    offer_label: Mapped[str | None] = mapped_column(String(100))
    offer_starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    offer_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    mode: Mapped[str] = mapped_column(String, nullable=False)
    duration_value: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_unit: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    professional: Mapped["Professional"] = relationship(back_populates="services")


class ProfessionalSessionType(Base):
    __tablename__ = "professional_session_types"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    session_type: Mapped[str] = mapped_column(String, nullable=False)

    professional: Mapped["Professional"] = relationship(back_populates="session_types")


class ProfessionalSubcategory(Base):
    __tablename__ = "professional_subcategories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)

    professional: Mapped["Professional"] = relationship(back_populates="subcategories")


class ProfessionalServiceArea(Base):
    __tablename__ = "professional_service_areas"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    city_name: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6))
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6))
    radius_km: Mapped[int] = mapped_column(Integer, nullable=False, server_default="300")
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    professional: Mapped["Professional"] = relationship(back_populates="service_areas")


class ProfessionalBoostImpression(Base):
    __tablename__ = "professional_boost_impressions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id"), nullable=False
    )
    surface: Mapped[str] = mapped_column(String(32), nullable=False)
    slot_position: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    placement_label: Mapped[str] = mapped_column(String(32), nullable=False, server_default="Boosted")
    query_text: Mapped[str | None] = mapped_column(Text)
    user_latitude: Mapped[float | None] = mapped_column(Numeric(9, 6))
    user_longitude: Mapped[float | None] = mapped_column(Numeric(9, 6))
    radius_km: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    professional: Mapped["Professional"] = relationship(lazy="joined")


class ProfessionalFeaturedIndex(Base):
    __tablename__ = "professional_featured_index"

    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professionals.user_id", ondelete="CASCADE"), primary_key=True
    )
    sort_rank: Mapped[int] = mapped_column(Integer, nullable=False)
    rank_score: Mapped[float] = mapped_column(Numeric, nullable=False, server_default="0")
    membership_tier: Mapped[str | None] = mapped_column(String(32))
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    professional: Mapped["Professional"] = relationship(lazy="joined")
