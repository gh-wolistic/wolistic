"""add client management tables

Revision ID: g12h3i4j5k6l
Revises: f81d3c9e0a55
Create Date: 2026-04-12 12:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "g12h3i4j5k6l"
down_revision = "f81d3c9e0a55"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- expert_clients --------------------------------------------------
    op.create_table(
        "expert_clients",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("professional_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("phone", sa.String(64), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(16), server_default="active", nullable=False),
        sa.Column("package_name", sa.String(255), nullable=True),
        sa.Column("last_session_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_session_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_expert_clients_professional_id", "expert_clients", ["professional_id"])
    op.create_index("ix_expert_clients_user_id", "expert_clients", ["user_id"])

    # --- expert_client_followups -----------------------------------------
    op.create_table(
        "expert_client_followups",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("professional_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", sa.BigInteger(), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["client_id"], ["expert_clients.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_expert_client_followups_professional_id", "expert_client_followups", ["professional_id"])
    op.create_index("ix_expert_client_followups_client_id", "expert_client_followups", ["client_id"])

    # --- expert_leads ----------------------------------------------------
    op.create_table(
        "expert_leads",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("professional_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("phone", sa.String(64), nullable=True),
        sa.Column("source", sa.String(32), server_default="direct", nullable=False),
        sa.Column("interest", sa.Text(), nullable=True),
        sa.Column("status", sa.String(16), server_default="new", nullable=False),
        sa.Column("enquiry_date", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.user_id"], ondelete="CASCADE"),
    )
    op.create_index("ix_expert_leads_professional_id", "expert_leads", ["professional_id"])


def downgrade() -> None:
    op.drop_index("ix_expert_leads_professional_id", table_name="expert_leads")
    op.drop_table("expert_leads")

    op.drop_index("ix_expert_client_followups_client_id", table_name="expert_client_followups")
    op.drop_index("ix_expert_client_followups_professional_id", table_name="expert_client_followups")
    op.drop_table("expert_client_followups")

    op.drop_index("ix_expert_clients_user_id", table_name="expert_clients")
    op.drop_index("ix_expert_clients_professional_id", table_name="expert_clients")
    op.drop_table("expert_clients")
