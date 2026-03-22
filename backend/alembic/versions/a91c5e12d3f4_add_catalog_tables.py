"""add catalog tables

Revision ID: a91c5e12d3f4
Revises: f577acd2eef7
Create Date: 2026-03-22 12:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "a91c5e12d3f4"
down_revision = "f577acd2eef7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "catalog_brands",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column("hero_image_url", sa.Text(), nullable=True),
        sa.Column("website_url", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_catalog_brands_name", "catalog_brands", ["name"], unique=False)

    op.create_table(
        "catalog_products",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("brand_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("rating", sa.Numeric(precision=3, scale=2), server_default=sa.text("0"), nullable=False),
        sa.Column("external_url", sa.Text(), nullable=True),
        sa.Column("is_featured", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["brand_id"], ["catalog_brands.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_catalog_products_brand_id", "catalog_products", ["brand_id"], unique=False)
    op.create_index("ix_catalog_products_category", "catalog_products", ["category"], unique=False)

    op.create_table(
        "catalog_services",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("service_type", sa.String(length=100), nullable=True),
        sa.Column("accreditation_body", sa.String(length=255), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("eligibility", sa.Text(), nullable=True),
        sa.Column("duration", sa.String(length=120), nullable=True),
        sa.Column("delivery_format", sa.String(length=120), nullable=True),
        sa.Column("fees", sa.String(length=120), nullable=True),
        sa.Column("verification_method", sa.Text(), nullable=True),
        sa.Column("focus_areas", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("apply_url", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_catalog_services_name", "catalog_services", ["name"], unique=False)

    op.create_table(
        "catalog_influencers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("focus", sa.String(length=255), nullable=True),
        sa.Column("follower_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("content_summary", sa.Text(), nullable=True),
        sa.Column("profile_url", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_catalog_influencers_name", "catalog_influencers", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_catalog_influencers_name", table_name="catalog_influencers")
    op.drop_table("catalog_influencers")

    op.drop_index("ix_catalog_services_name", table_name="catalog_services")
    op.drop_table("catalog_services")

    op.drop_index("ix_catalog_products_category", table_name="catalog_products")
    op.drop_index("ix_catalog_products_brand_id", table_name="catalog_products")
    op.drop_table("catalog_products")

    op.drop_index("ix_catalog_brands_name", table_name="catalog_brands")
    op.drop_table("catalog_brands")
