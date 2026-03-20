"""add professional geo columns

Revision ID: 20260320_0016
Revises: 20260317_0015
Create Date: 2026-03-20 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260320_0016"
down_revision = "20260317_0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("professionals", sa.Column("latitude", sa.Numeric(precision=9, scale=6), nullable=True))
    op.add_column("professionals", sa.Column("longitude", sa.Numeric(precision=9, scale=6), nullable=True))


def downgrade() -> None:
    op.drop_column("professionals", "longitude")
    op.drop_column("professionals", "latitude")
