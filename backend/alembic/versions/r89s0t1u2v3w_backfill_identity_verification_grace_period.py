"""backfill identity verification grace period

Revision ID: r89s0t1u2v3w
Revises: q78r9s0t1u2v
Create Date: 2026-04-18 14:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "r89s0t1u2v3w"
down_revision: Union[str, None] = "q78r9s0t1u2v"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Backfill professional_identity_verification for all existing professionals.
    
    Gives them a 7-day grace period from NOW (not from their account creation date)
    to upload identity documents before they're hidden from search.
    """
    op.execute("""
        INSERT INTO professional_identity_verification (
            user_id,
            document_type,
            document_url,
            verification_status,
            grace_period_expires_at,
            submitted_at
        )
        SELECT 
            p.user_id,
            'aadhaar',  -- Placeholder, will be updated when professional uploads
            '',  -- No document yet
            'pending',
            NOW() + INTERVAL '7 days',  -- 7-day grace period from migration time
            p.created_at
        FROM professionals p
        WHERE NOT EXISTS (
            SELECT 1 
            FROM professional_identity_verification piv
            WHERE piv.user_id = p.user_id
        )
    """)


def downgrade() -> None:
    """
    Remove backfilled records.
    
    WARNING: This will delete identity verification records for all professionals
    who had empty document_url (backfilled records).
    """
    op.execute("""
        DELETE FROM professional_identity_verification
        WHERE document_url = '' AND verification_status = 'pending'
    """)
