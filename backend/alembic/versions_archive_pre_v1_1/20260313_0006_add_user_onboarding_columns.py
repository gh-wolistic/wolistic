"""add user onboarding columns

Revision ID: 20260313_0006
Revises: 20260313_0005
Create Date: 2026-03-13 00:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260313_0006"
down_revision: Union[str, None] = "20260313_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


USER_TYPE_VALUES = ("client", "partner")
USER_SUBTYPE_VALUES = (
    "client",
    "body_expert",
    "mind_expert",
    "diet_expert",
    "mutiple_roles",
    "brand",
    "influencer",
)


def upgrade() -> None:
    op.add_column("users", sa.Column("user_type", sa.String(length=32), nullable=True))
    op.add_column("users", sa.Column("user_subtype", sa.String(length=32), nullable=True))

    op.create_check_constraint(
        "ck_users_user_type_allowed",
        "users",
        f"user_type IS NULL OR user_type IN {USER_TYPE_VALUES}",
    )
    op.create_check_constraint(
        "ck_users_user_subtype_allowed",
        "users",
        f"user_subtype IS NULL OR user_subtype IN {USER_SUBTYPE_VALUES}",
    )

    op.execute(
        """
        UPDATE users AS u
        SET user_type = CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM professionals AS p
                    WHERE p.user_id = u.id
                ) THEN 'partner'
                ELSE 'client'
            END,
            user_subtype = CASE
                WHEN NOT EXISTS (
                    SELECT 1
                    FROM professionals AS p
                    WHERE p.user_id = u.id
                ) THEN 'client'
                ELSE (
                    WITH professional_signals AS (
                        SELECT
                            lower(
                                concat_ws(
                                    ' ',
                                    coalesce(p.username, ''),
                                    coalesce(p.specialization, ''),
                                    coalesce(p.short_bio, ''),
                                    coalesce(p.about, '')
                                )
                            ) AS signal
                        FROM professionals AS p
                        WHERE p.user_id = u.id
                    )
                    SELECT CASE
                        WHEN signal LIKE '%brand%' THEN 'brand'
                        WHEN signal LIKE '%influencer%' THEN 'influencer'
                        WHEN (
                            CASE
                                WHEN signal ~ '(nutrition|diet|dietitian|food|gut)' THEN 1
                                ELSE 0
                            END +
                            CASE
                                WHEN signal ~ '(mind|mental|psych|therapy|counsel|meditat|stress|sleep|breath)' THEN 1
                                ELSE 0
                            END +
                            CASE
                                WHEN signal ~ '(fitness|physio|body|movement|yoga|pilates|strength|sports)' THEN 1
                                ELSE 0
                            END
                        ) > 1 THEN 'mutiple_roles'
                        WHEN signal ~ '(nutrition|diet|dietitian|food|gut)' THEN 'diet_expert'
                        WHEN signal ~ '(mind|mental|psych|therapy|counsel|meditat|stress|sleep|breath)' THEN 'mind_expert'
                        ELSE 'body_expert'
                    END
                    FROM professional_signals
                )
            END
        """
    )


def downgrade() -> None:
    op.drop_constraint("ck_users_user_subtype_allowed", "users", type_="check")
    op.drop_constraint("ck_users_user_type_allowed", "users", type_="check")
    op.drop_column("users", "user_subtype")
    op.drop_column("users", "user_type")