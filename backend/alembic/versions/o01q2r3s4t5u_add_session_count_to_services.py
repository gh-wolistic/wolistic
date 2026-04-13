"""add session_count to professional_services

Revision ID: o01q2r3s4t5u
Revises: n90p1q2r3s4t
Create Date: 2026-04-13 00:00:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "o01q2r3s4t5u"
down_revision = "n90p1q2r3s4t"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "professional_services",
        sa.Column(
            "session_count",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )


def downgrade() -> None:
    op.drop_column("professional_services", "session_count")
