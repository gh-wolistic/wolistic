"""add payment provider tracking fields

Revision ID: 20260313_0005
Revises: 20260312_0004
Create Date: 2026-03-13 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260313_0005"
down_revision: Union[str, None] = "20260312_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE booking_payments ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(128)"
    )
    op.execute(
        "ALTER TABLE booking_payments ADD COLUMN IF NOT EXISTS provider_signature VARCHAR(512)"
    )
    op.execute(
        "ALTER TABLE booking_payments ADD COLUMN IF NOT EXISTS provider_payload JSONB"
    )
    op.execute(
        "ALTER TABLE booking_payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ"
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ux_booking_payments_provider_payment_id ON booking_payments (provider_payment_id) WHERE provider_payment_id IS NOT NULL"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ux_booking_payments_provider_payment_id")
    op.execute("ALTER TABLE booking_payments DROP COLUMN IF EXISTS verified_at")
    op.execute("ALTER TABLE booking_payments DROP COLUMN IF EXISTS provider_payload")
    op.execute("ALTER TABLE booking_payments DROP COLUMN IF EXISTS provider_signature")
    op.execute("ALTER TABLE booking_payments DROP COLUMN IF EXISTS provider_payment_id")