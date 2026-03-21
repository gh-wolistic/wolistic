"""add profile completeness and performance indexes

Revision ID: 20260321_0023
Revises: 20260321_0022
Create Date: 2026-03-21 10:30:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260321_0023"
down_revision: Union[str, None] = "20260321_0022"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "professionals",
        sa.Column("profile_completeness", sa.SmallInteger(), nullable=False, server_default="0"),
    )

    op.execute(
        """
        UPDATE professionals
        SET profile_completeness = LEAST(
            100,
            GREATEST(
                0,
                ROUND(
                    (
                        (
                            CASE WHEN NULLIF(BTRIM(username), '') IS NOT NULL THEN 1 ELSE 0 END +
                            CASE WHEN NULLIF(BTRIM(cover_image_url), '') IS NOT NULL THEN 1 ELSE 0 END +
                            CASE WHEN NULLIF(BTRIM(profile_image_url), '') IS NOT NULL THEN 1 ELSE 0 END +
                            CASE WHEN NULLIF(BTRIM(specialization), '') IS NOT NULL THEN 1 ELSE 0 END +
                            CASE WHEN NULLIF(BTRIM(membership_tier), '') IS NOT NULL THEN 1 ELSE 0 END +
                            CASE WHEN NULLIF(BTRIM(location), '') IS NOT NULL THEN 1 ELSE 0 END +
                            CASE WHEN COALESCE(experience_years, 0) > 0 THEN 1 ELSE 0 END +
                            CASE WHEN NULLIF(BTRIM(sex), '') IS NOT NULL AND LOWER(BTRIM(sex)) <> 'undisclosed' THEN 1 ELSE 0 END +
                            CASE WHEN NULLIF(BTRIM(short_bio), '') IS NOT NULL THEN 1 ELSE 0 END +
                            CASE WHEN NULLIF(BTRIM(about), '') IS NOT NULL THEN 1 ELSE 0 END +
                            CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END +
                            CASE WHEN longitude IS NOT NULL THEN 1 ELSE 0 END
                        ) * 100.0 / 12.0
                    )
                )
            )
        )::smallint
        """
    )

    op.create_index(
        "ix_professionals_profile_completeness",
        "professionals",
        ["profile_completeness"],
        unique=False,
    )
    op.create_index(
        "ix_users_status_id",
        "users",
        ["user_status", "id"],
        unique=False,
    )

    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_professional_reviews_professional_created_id
        ON professional_reviews (professional_id, created_at DESC, id DESC)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_professional_services_professional_active_mode
        ON professional_services (professional_id, is_active, mode)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_professionals_lat_lng_not_null
        ON professionals (latitude, longitude)
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_professional_service_areas_prof_coords_not_null
        ON professional_service_areas (professional_id, latitude, longitude)
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_professional_service_areas_prof_coords_not_null")
    op.execute("DROP INDEX IF EXISTS ix_professionals_lat_lng_not_null")
    op.execute("DROP INDEX IF EXISTS ix_professional_services_professional_active_mode")
    op.execute("DROP INDEX IF EXISTS ix_professional_reviews_professional_created_id")

    op.drop_index("ix_users_status_id", table_name="users")
    op.drop_index("ix_professionals_profile_completeness", table_name="professionals")
    op.drop_column("professionals", "profile_completeness")
