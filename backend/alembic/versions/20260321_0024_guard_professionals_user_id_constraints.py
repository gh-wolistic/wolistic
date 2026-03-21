"""guard professionals user_id constraints for legacy drift

Revision ID: 20260321_0024
Revises: 20260321_0023
Create Date: 2026-03-21 10:45:00.000000
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260321_0024"
down_revision: Union[str, None] = "20260321_0023"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'professionals'
                  AND column_name = 'user_id'
                  AND is_nullable = 'YES'
            ) THEN
                ALTER TABLE public.professionals
                ALTER COLUMN user_id SET NOT NULL;
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
                WHERE conname = 'uq_professionals_user_id_guard'
            ) THEN
                ALTER TABLE public.professionals
                ADD CONSTRAINT uq_professionals_user_id_guard UNIQUE (user_id);
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE public.professionals
        DROP CONSTRAINT IF EXISTS uq_professionals_user_id_guard;
        """
    )
