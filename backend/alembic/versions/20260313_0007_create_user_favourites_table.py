"""create user_favourites table

Revision ID: 20260313_0007
Revises: 20260313_0006
Create Date: 2026-03-13 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260313_0007"
down_revision: Union[str, None] = "20260313_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS user_favourites (
            user_id         UUID        NOT NULL REFERENCES users(id)             ON DELETE CASCADE,
            professional_id UUID        NOT NULL REFERENCES professionals(user_id) ON DELETE CASCADE,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (user_id, professional_id)
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_user_favourites_user_id "
        "ON user_favourites (user_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_user_favourites_professional_id "
        "ON user_favourites (professional_id)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_user_favourites_professional_id")
    op.execute("DROP INDEX IF EXISTS ix_user_favourites_user_id")
    op.execute("DROP TABLE IF EXISTS user_favourites")
