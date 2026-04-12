"""add professional_settings table

Revision ID: h34j5k6l7m8n
Revises: g12h3i4j5k6l
Create Date: 2026-04-13 10:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "h34j5k6l7m8n"
down_revision = "g12h3i4j5k6l"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "professional_settings",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column(
            "professional_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("display_name", sa.String(255), nullable=True),
        sa.Column(
            "timezone",
            sa.String(100),
            nullable=False,
            server_default="Asia/Kolkata",
        ),
        sa.Column("language", sa.String(10), nullable=False, server_default="EN"),
        sa.Column(
            "notifications",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "weekly_digest",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "privacy",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["professional_id"],
            ["professionals.user_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("professional_id"),
    )
    op.create_index(
        op.f("ix_professional_settings_professional_id"),
        "professional_settings",
        ["professional_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_professional_settings_professional_id"),
        table_name="professional_settings",
    )
    op.drop_table("professional_settings")
