"""add structured offer fields to professional_services

Revision ID: 20260313_0008
Revises: 20260313_0007
Create Date: 2026-03-13 18:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260313_0008"
down_revision: Union[str, None] = "20260313_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE professional_services "
        "ADD COLUMN IF NOT EXISTS negotiable BOOLEAN NOT NULL DEFAULT FALSE"
    )
    op.execute(
        "ALTER TABLE professional_services "
        "ADD COLUMN IF NOT EXISTS offer_type VARCHAR(20)"
    )
    op.execute(
        "ALTER TABLE professional_services "
        "ADD COLUMN IF NOT EXISTS offer_value INTEGER"
    )
    op.execute(
        "ALTER TABLE professional_services "
        "ADD COLUMN IF NOT EXISTS offer_label VARCHAR(100)"
    )
    op.execute(
        "ALTER TABLE professional_services "
        "ADD COLUMN IF NOT EXISTS offer_starts_at TIMESTAMPTZ"
    )
    op.execute(
        "ALTER TABLE professional_services "
        "ADD COLUMN IF NOT EXISTS offer_ends_at TIMESTAMPTZ"
    )

    op.execute(
        "UPDATE professional_services "
        "SET offer_type = 'none' "
        "WHERE offer_type IS NULL"
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'ck_professional_services_price_non_negative'
            ) THEN
                ALTER TABLE professional_services
                ADD CONSTRAINT ck_professional_services_price_non_negative
                CHECK (price >= 0);
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'ck_professional_services_offer_type_allowed'
            ) THEN
                ALTER TABLE professional_services
                ADD CONSTRAINT ck_professional_services_offer_type_allowed
                CHECK (
                    offer_type IN ('none', 'percentage', 'percent', 'flat', 'cashback', 'free')
                );
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'ck_professional_services_offer_value_valid'
            ) THEN
                ALTER TABLE professional_services
                ADD CONSTRAINT ck_professional_services_offer_value_valid
                CHECK (
                    offer_value IS NULL
                    OR (
                        (offer_type IN ('flat', 'cashback') AND offer_value >= 0)
                        OR (offer_type IN ('percentage', 'percent') AND offer_value BETWEEN 0 AND 100)
                    )
                    OR offer_type IN ('none', 'free')
                );
            END IF;
        END $$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'ck_professional_services_offer_window'
            ) THEN
                ALTER TABLE professional_services
                ADD CONSTRAINT ck_professional_services_offer_window
                CHECK (
                    offer_starts_at IS NULL
                    OR offer_ends_at IS NULL
                    OR offer_starts_at <= offer_ends_at
                );
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE professional_services DROP CONSTRAINT IF EXISTS ck_professional_services_offer_window"
    )
    op.execute(
        "ALTER TABLE professional_services DROP CONSTRAINT IF EXISTS ck_professional_services_offer_value_valid"
    )
    op.execute(
        "ALTER TABLE professional_services DROP CONSTRAINT IF EXISTS ck_professional_services_offer_type_allowed"
    )
    op.execute(
        "ALTER TABLE professional_services DROP CONSTRAINT IF EXISTS ck_professional_services_price_non_negative"
    )

    op.execute("ALTER TABLE professional_services DROP COLUMN IF EXISTS offer_ends_at")
    op.execute("ALTER TABLE professional_services DROP COLUMN IF EXISTS offer_starts_at")
    op.execute("ALTER TABLE professional_services DROP COLUMN IF EXISTS offer_label")
    op.execute("ALTER TABLE professional_services DROP COLUMN IF EXISTS offer_value")
    op.execute("ALTER TABLE professional_services DROP COLUMN IF EXISTS offer_type")
    op.execute("ALTER TABLE professional_services DROP COLUMN IF EXISTS negotiable")