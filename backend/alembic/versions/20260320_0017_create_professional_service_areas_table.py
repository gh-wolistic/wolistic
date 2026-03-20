"""create professional service areas table

Revision ID: 20260320_0017
Revises: 20260320_0016
Create Date: 2026-03-20 00:10:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260320_0017"
down_revision = "20260320_0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "professional_service_areas",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("professional_id", sa.UUID(), nullable=False),
        sa.Column("city_name", sa.String(), nullable=False),
        sa.Column("latitude", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("longitude", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("radius_km", sa.Integer(), nullable=False, server_default="300"),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.user_id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_professional_service_areas_professional_id",
        "professional_service_areas",
        ["professional_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_professional_service_areas_professional_id", table_name="professional_service_areas")
    op.drop_table("professional_service_areas")
