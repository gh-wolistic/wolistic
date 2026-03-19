"""bootstrap professionals on users insert

Revision ID: 20260317_0015
Revises: 20260316_0014
Create Date: 2026-03-17 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260317_0015"
down_revision: Union[str, None] = "20260316_0014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.bootstrap_professional_from_user()
        RETURNS TRIGGER AS $$
        DECLARE
            base_username TEXT;
            generated_username TEXT;
        BEGIN
            base_username := lower(regexp_replace(split_part(COALESCE(NEW.email, ''), '@', 1), '[^a-z0-9]+', '-', 'g'));
            base_username := trim(both '-' from base_username);

            IF base_username IS NULL OR base_username = '' THEN
                base_username := 'user';
            END IF;

            generated_username := left(base_username || '-' || left(replace(NEW.id::text, '-', ''), 8), 100);

            INSERT INTO public.professionals (
                user_id,
                username,
                specialization,
                experience_years,
                sex
            )
            VALUES (
                NEW.id,
                generated_username,
                'Wellness Expert',
                0,
                'undisclosed'
            )
            ON CONFLICT (user_id) DO NOTHING;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
        """
    )

    op.execute("DROP TRIGGER IF EXISTS trg_bootstrap_professional_from_user ON public.users;")
    op.execute(
        """
        CREATE TRIGGER trg_bootstrap_professional_from_user
        AFTER INSERT ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION public.bootstrap_professional_from_user();
        """
    )

    op.execute(
        """
        INSERT INTO public.professionals (
            user_id,
            username,
            specialization,
            experience_years,
            sex
        )
        SELECT
            u.id,
            left(
                COALESCE(
                    NULLIF(trim(both '-' from lower(regexp_replace(split_part(COALESCE(u.email, ''), '@', 1), '[^a-z0-9]+', '-', 'g'))), ''),
                    'user'
                ) || '-' || left(replace(u.id::text, '-', ''), 8),
                100
            ) AS generated_username,
            'Wellness Expert',
            0,
            'undisclosed'
        FROM public.users u
        LEFT JOIN public.professionals p
            ON p.user_id = u.id
        WHERE p.user_id IS NULL
        ON CONFLICT (user_id) DO NOTHING;
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_bootstrap_professional_from_user ON public.users;")
    op.execute("DROP FUNCTION IF EXISTS public.bootstrap_professional_from_user();")
