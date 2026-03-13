"""add image_url to wolistic_services

Revision ID: 20260314_0012
Revises: 20260314_0011
Create Date: 2026-03-14 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260314_0012"
down_revision: Union[str, None] = "20260314_0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE wolistic_services ADD COLUMN IF NOT EXISTS image_url TEXT"
    )

    # Backfill seeded wellness centers with representative Unsplash images
    op.execute(
        """
        UPDATE wolistic_services
        SET image_url = COALESCE(
            image_url,
            CASE title
                WHEN 'Ananda Spa & Wellness Retreat'
                    THEN 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80'
                WHEN 'Cult.fit Fitness Studio'
                    THEN 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
                WHEN 'Fortis Nutrition Clinic'
                    THEN 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80'
                WHEN 'Art of Living Foundation'
                    THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80'
                WHEN 'Physio World'
                    THEN 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80'
                WHEN 'Kaya Skin & Body Clinic'
                    THEN 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80'
                ELSE NULL
            END
        )
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE wolistic_services DROP COLUMN IF EXISTS image_url")
