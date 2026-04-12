"""add activity tables

Revision ID: c9d8e7f6a5b4
Revises: a1b2c3d4e5f6
Create Date: 2026-04-12 12:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "c9d8e7f6a5b4"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- partner_activities -------------------------------------------
    op.create_table(
        "partner_activities",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("professional_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(32), server_default="yet-to-start", nullable=False),
        sa.Column("priority", sa.String(16), server_default="medium", nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
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
    )
    op.create_index(
        "ix_partner_activities_professional_id",
        "partner_activities",
        ["professional_id"],
    )

    # --- wolistic_activity_templates ---------------------------------
    op.create_table(
        "wolistic_activity_templates",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(64), server_default="Profile", nullable=False),
        sa.Column("priority", sa.String(16), server_default="medium", nullable=False),
        sa.Column("applies_to_subtype", sa.String(32), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
    )

    # --- partner_internal_activity_statuses --------------------------
    op.create_table(
        "partner_internal_activity_statuses",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("professional_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("template_id", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(32), server_default="yet-to-start", nullable=False),
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
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["wolistic_activity_templates.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "professional_id",
            "template_id",
            name="uq_partner_internal_activity_status",
        ),
    )


def downgrade() -> None:
    op.drop_table("partner_internal_activity_statuses")
    op.drop_table("wolistic_activity_templates")
    op.drop_index("ix_partner_activities_professional_id", table_name="partner_activities")
    op.drop_table("partner_activities")
