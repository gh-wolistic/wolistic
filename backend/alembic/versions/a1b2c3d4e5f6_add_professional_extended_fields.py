"""add professional extended fields and draft profile

Revision ID: a1b2c3d4e5f6
Revises: f81d3c9e0a55
Create Date: 2026-05-01 00:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "f81d3c9e0a55"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("professionals", sa.Column("pronouns", sa.String(64), nullable=True))
    op.add_column("professionals", sa.Column("who_i_work_with", sa.Text, nullable=True))
    op.add_column(
        "professionals",
        sa.Column("client_goals", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "professionals",
        sa.Column("response_time_hours", sa.Integer, nullable=False, server_default="24"),
    )
    op.add_column(
        "professionals",
        sa.Column("cancellation_hours", sa.Integer, nullable=False, server_default="24"),
    )
    op.add_column(
        "professionals",
        sa.Column(
            "social_links",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            server_default="{}",
        ),
    )
    op.add_column("professionals", sa.Column("video_intro_url", sa.Text, nullable=True))
    op.add_column(
        "professionals",
        sa.Column("default_timezone", sa.String(100), nullable=False, server_default="UTC"),
    )
    op.add_column(
        "professionals",
        sa.Column(
            "draft_profile",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )
    op.add_column(
        "professionals",
        sa.Column("draft_updated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("professionals", "draft_updated_at")
    op.drop_column("professionals", "draft_profile")
    op.drop_column("professionals", "default_timezone")
    op.drop_column("professionals", "video_intro_url")
    op.drop_column("professionals", "social_links")
    op.drop_column("professionals", "cancellation_hours")
    op.drop_column("professionals", "response_time_hours")
    op.drop_column("professionals", "client_goals")
    op.drop_column("professionals", "who_i_work_with")
    op.drop_column("professionals", "pronouns")
