"""add classes and work locations tables

Revision ID: i45k6l7m8n9o
Revises: h34j5k6l7m8n
Create Date: 2026-04-14 10:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "i45k6l7m8n9o"
down_revision = "h34j5k6l7m8n"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── work_locations ────────────────────────────────────────────────────────
    op.create_table(
        "work_locations",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column(
            "professional_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("location_type", sa.String(32), nullable=False, server_default="gym"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["professional_id"],
            ["professionals.user_id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_work_locations_professional_id", "work_locations", ["professional_id"])

    # ── group_classes ─────────────────────────────────────────────────────────
    op.create_table(
        "group_classes",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column(
            "professional_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("work_location_id", sa.BigInteger(), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("category", sa.String(32), nullable=False, server_default="other"),
        sa.Column("status", sa.String(16), nullable=False, server_default="draft"),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("capacity", sa.Integer(), nullable=False, server_default="20"),
        sa.Column("price", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["professional_id"],
            ["professionals.user_id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["work_location_id"],
            ["work_locations.id"],
            ondelete="SET NULL",
        ),
    )
    op.create_index("ix_group_classes_professional_id", "group_classes", ["professional_id"])
    op.create_index("ix_group_classes_work_location_id", "group_classes", ["work_location_id"])

    # ── class_sessions ────────────────────────────────────────────────────────
    op.create_table(
        "class_sessions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("group_class_id", sa.BigInteger(), nullable=False),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["group_class_id"],
            ["group_classes.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_class_sessions_group_class_id", "class_sessions", ["group_class_id"])

    # ── class_enrollments ─────────────────────────────────────────────────────
    op.create_table(
        "class_enrollments",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("class_session_id", sa.BigInteger(), nullable=False),
        sa.Column("expert_client_id", sa.BigInteger(), nullable=True),
        sa.Column("client_name", sa.String(255), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="confirmed"),
        sa.Column("payment_status", sa.String(16), nullable=False, server_default="pending"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["class_session_id"],
            ["class_sessions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["expert_client_id"],
            ["expert_clients.id"],
            ondelete="SET NULL",
        ),
    )
    op.create_index("ix_class_enrollments_class_session_id", "class_enrollments", ["class_session_id"])
    op.create_index("ix_class_enrollments_expert_client_id", "class_enrollments", ["expert_client_id"])


def downgrade() -> None:
    op.drop_table("class_enrollments")
    op.drop_table("class_sessions")
    op.drop_table("group_classes")
    op.drop_table("work_locations")
