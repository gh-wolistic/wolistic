"""reactivate engine generated holistic teams

Revision ID: 20260321_0022
Revises: 20260321_0021
Create Date: 2026-03-21 00:00:01.000000
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260321_0022"
down_revision: Union[str, None] = "20260321_0021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE holistic_teams
        SET is_active = TRUE
        WHERE source_type = 'engine_generated'
          AND is_active = FALSE;
        """
    )


def downgrade() -> None:
    # No safe downgrade: this migration restores activity state that had been
    # deactivated by older auto-refresh logic.
    pass
