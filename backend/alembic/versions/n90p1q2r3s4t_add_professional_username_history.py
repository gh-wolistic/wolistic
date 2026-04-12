"""add professional_username_history table

Revision ID: n90p1q2r3s4t
Revises: 5d3696a49fb0
Create Date: 2026-04-13 00:00:00.000000

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "n90p1q2r3s4t"
down_revision = "5d3696a49fb0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "professional_username_history",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column(
            "professional_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("professionals.user_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("old_username", sa.String(), nullable=False),
        sa.Column("new_username", sa.String(), nullable=False),
        sa.Column(
            "changed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_professional_username_history_professional_id",
        "professional_username_history",
        ["professional_id", "changed_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_professional_username_history_professional_id")
    op.drop_table("professional_username_history")
