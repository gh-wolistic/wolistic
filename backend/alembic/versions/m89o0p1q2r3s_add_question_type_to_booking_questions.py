"""add question_type to booking_question_templates

Revision ID: m89o0p1q2r3s
Revises: l78n9o0p1q2r
Create Date: 2025-01-01 00:00:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "m89o0p1q2r3s"
down_revision = "l78n9o0p1q2r"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "booking_question_templates",
        sa.Column(
            "question_type",
            sa.String(20),
            nullable=False,
            server_default="text",
        ),
    )


def downgrade() -> None:
    op.drop_column("booking_question_templates", "question_type")
