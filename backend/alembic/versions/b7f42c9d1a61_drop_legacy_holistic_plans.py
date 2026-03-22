"""drop legacy holistic plans

Revision ID: b7f42c9d1a61
Revises: a91c5e12d3f4
Create Date: 2026-03-22 20:45:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "b7f42c9d1a61"
down_revision = "a91c5e12d3f4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS holistic_plans CASCADE")


def downgrade() -> None:
    op.create_table(
        "holistic_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("package_price", sa.Text(), nullable=False),
        sa.Column("schedule", sa.Text(), nullable=False),
        sa.Column("includes", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("experts", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("assignment_status", sa.Text(), nullable=False),
        sa.Column("session_breakdown", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
