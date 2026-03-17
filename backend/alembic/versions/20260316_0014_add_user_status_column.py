"""add user_status to users

Revision ID: 20260316_0014
Revises: 20260315_0013
Create Date: 2026-03-16 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260316_0014"
down_revision: Union[str, None] = "20260315_0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

USER_STATUS_VALUES = ("pending", "verified", "suspended")


def upgrade() -> None:
    op.add_column("users", sa.Column("user_status", sa.String(length=16), nullable=True))

    op.create_check_constraint(
        "ck_users_user_status_allowed",
        "users",
        f"user_status IS NULL OR user_status IN {USER_STATUS_VALUES}",
    )

    op.execute(
        """
        UPDATE users
        SET user_status = CASE
            WHEN user_type = 'client' THEN 'verified'
            WHEN user_type = 'partner' AND user_status IS NULL THEN 'pending'
            WHEN user_type = 'partner' AND user_status NOT IN ('pending', 'verified', 'suspended') THEN 'pending'
            ELSE user_status
        END
        """
    )

    op.execute(
        """
        CREATE OR REPLACE FUNCTION users_set_user_status()
        RETURNS trigger AS $$
        BEGIN
            IF NEW.user_type = 'client' THEN
                NEW.user_status := 'verified';
            ELSIF NEW.user_type = 'partner' THEN
                IF NEW.user_status IS NULL THEN
                    NEW.user_status := 'pending';
                END IF;
            END IF;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_users_set_user_status
        BEFORE INSERT OR UPDATE OF user_type, user_status ON users
        FOR EACH ROW
        EXECUTE FUNCTION users_set_user_status();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_users_set_user_status ON users")
    op.execute("DROP FUNCTION IF EXISTS users_set_user_status")
    op.drop_constraint("ck_users_user_status_allowed", "users", type_="check")
    op.drop_column("users", "user_status")
