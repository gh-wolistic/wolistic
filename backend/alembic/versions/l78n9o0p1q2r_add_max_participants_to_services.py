"""add max_participants to professional_services

Revision ID: l78n9o0p1q2r
Revises: k67m8n9o1p2q
Create Date: 2025-01-01 00:00:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "l78n9o0p1q2r"
down_revision = "k67m8n9o1p2q"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "professional_services",
        sa.Column("max_participants", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("professional_services", "max_participants")
