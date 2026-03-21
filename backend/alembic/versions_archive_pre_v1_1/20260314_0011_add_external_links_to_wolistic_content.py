"""add external links to wolistic content

Revision ID: 20260314_0011
Revises: 20260314_0010
Create Date: 2026-03-14 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260314_0011"
down_revision: Union[str, None] = "20260314_0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE wolistic_products ADD COLUMN IF NOT EXISTS website_name VARCHAR(255)"
    )
    op.execute(
        "ALTER TABLE wolistic_products ADD COLUMN IF NOT EXISTS website_url TEXT"
    )
    op.execute(
        "ALTER TABLE wolistic_services ADD COLUMN IF NOT EXISTS website_name VARCHAR(255)"
    )
    op.execute(
        "ALTER TABLE wolistic_services ADD COLUMN IF NOT EXISTS website_url TEXT"
    )

    op.execute(
        """
        UPDATE wolistic_products
        SET website_name = COALESCE(website_name, brand),
            website_url = COALESCE(
                website_url,
                CASE brand
                    WHEN 'MuscleBlaze' THEN 'https://www.muscleblaze.com'
                    WHEN 'HealthKart' THEN 'https://www.healthkart.com'
                    WHEN 'Boldfit' THEN 'https://www.boldfit.com'
                    WHEN 'Strauss' THEN 'https://strausssport.com'
                    WHEN 'Himalaya' THEN 'https://himalayawellness.in'
                    WHEN 'Nivia' THEN 'https://www.nivia.in'
                    WHEN 'Yogablock' THEN 'https://www.yogablock.com'
                    WHEN 'FreshBox' THEN 'https://www.freshbox.in'
                    ELSE NULL
                END
            )
        """
    )

    op.execute(
        """
        UPDATE wolistic_services
        SET website_name = COALESCE(website_name, title),
            website_url = COALESCE(
                website_url,
                CASE title
                    WHEN 'Ananda Spa & Wellness Retreat' THEN 'https://www.anandaspa.com'
                    WHEN 'Cult.fit Fitness Studio' THEN 'https://www.cult.fit'
                    WHEN 'Fortis Nutrition Clinic' THEN 'https://www.fortishealthcare.com'
                    WHEN 'Art of Living Foundation' THEN 'https://www.artofliving.org'
                    WHEN 'Physio World' THEN 'https://www.physioworld.in'
                    WHEN 'Kaya Skin & Body Clinic' THEN 'https://www.kaya.in'
                    ELSE NULL
                END
            )
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE wolistic_services DROP COLUMN IF EXISTS website_url")
    op.execute("ALTER TABLE wolistic_services DROP COLUMN IF EXISTS website_name")
    op.execute("ALTER TABLE wolistic_products DROP COLUMN IF EXISTS website_url")
    op.execute("ALTER TABLE wolistic_products DROP COLUMN IF EXISTS website_name")