"""create professional boost impressions table

Revision ID: 20260320_0018
Revises: 20260320_0017
Create Date: 2026-03-20 01:20:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260320_0018"
down_revision = "20260320_0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "professional_boost_impressions",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("professional_id", sa.UUID(), nullable=False),
        sa.Column("surface", sa.String(length=32), nullable=False),
        sa.Column("slot_position", sa.SmallInteger(), nullable=False),
        sa.Column("placement_label", sa.String(length=32), nullable=False, server_default="Boosted"),
        sa.Column("query_text", sa.Text(), nullable=True),
        sa.Column("user_latitude", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("user_longitude", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("radius_km", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.user_id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_professional_boost_impressions_professional_id",
        "professional_boost_impressions",
        ["professional_id"],
    )
    op.create_index(
        "ix_professional_boost_impressions_surface_created_at",
        "professional_boost_impressions",
        ["surface", "created_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_professional_boost_impressions_surface_created_at",
        table_name="professional_boost_impressions",
    )
    op.drop_index(
        "ix_professional_boost_impressions_professional_id",
        table_name="professional_boost_impressions",
    )
    op.drop_table("professional_boost_impressions")
