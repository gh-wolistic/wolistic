"""ensure default initial consultation service for professionals

Revision ID: 20260321_0021
Revises: 20260320_0020
Create Date: 2026-03-21 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260321_0021"
down_revision: Union[str, None] = "20260320_0020"
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

            INSERT INTO public.professional_services (
                professional_id,
                name,
                short_brief,
                price,
                offers,
                negotiable,
                offer_type,
                offer_value,
                offer_label,
                mode,
                duration_value,
                duration_unit,
                is_active
            )
            SELECT
                NEW.id,
                'Initial Consultation',
                'Intro consultation to understand your goals and next steps.',
                250,
                '100% refund as credits',
                FALSE,
                'cashback',
                250,
                '100% refund as credits',
                'online',
                15,
                'mins',
                TRUE
            WHERE NOT EXISTS (
                SELECT 1
                FROM public.professional_services s
                WHERE s.professional_id = NEW.id
            );

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
        """
    )

    op.execute(
        """
        UPDATE public.professional_services AS s
        SET
            short_brief = COALESCE(s.short_brief, 'Intro consultation to understand your goals and next steps.'),
            price = 250,
            offers = '100% refund as credits',
            negotiable = FALSE,
            offer_type = 'cashback',
            offer_value = 250,
            offer_label = '100% refund as credits',
            mode = CASE WHEN trim(COALESCE(s.mode, '')) = '' THEN 'online' ELSE s.mode END,
            duration_value = 15,
            duration_unit = 'mins',
            is_active = TRUE
        WHERE lower(trim(s.name)) = 'initial consultation'
                    AND s.price = 0
                    AND COALESCE(lower(trim(s.offer_type)), 'none') = 'none'
                    AND s.offer_value IS NULL;
        """
    )

    op.execute(
        """
        INSERT INTO public.professional_services (
            professional_id,
            name,
            short_brief,
            price,
            offers,
            negotiable,
            offer_type,
            offer_value,
            offer_label,
            mode,
            duration_value,
            duration_unit,
            is_active
        )
        SELECT
            p.user_id,
            'Initial Consultation',
            'Intro consultation to understand your goals and next steps.',
            250,
            '100% refund as credits',
            FALSE,
            'cashback',
            250,
            '100% refund as credits',
            'online',
            15,
            'mins',
            TRUE
        FROM public.professionals p
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.professional_services s
            WHERE s.professional_id = p.user_id
        );
        """
    )


def downgrade() -> None:
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
