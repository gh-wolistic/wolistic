"""add client coin rules

Revision ID: f81d3c9e0a55
Revises: e53c8a2b7d41
Create Date: 2026-04-11 00:01:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "f81d3c9e0a55"
down_revision = "e53c8a2b7d41"
branch_labels = None
depends_on = None

# ---------------------------------------------------------------------------
# New client-focused coin rules to insert / upsert into coin_rules.
# Tuple: (event_type, coins_awarded, is_active, max_per_user, cooldown_days, description)
# ---------------------------------------------------------------------------
_NEW_RULES: list[tuple[str, int, bool, int | None, int | None, str]] = [
    (
        "client_onboarding_complete",
        75,
        True,
        1,
        None,
        "Client completes the onboarding flow (chooses client role)",
    ),
    (
        "first_booking",
        200,
        True,
        1,
        None,
        "Client earns a bonus for making their very first confirmed booking",
    ),
    (
        "daily_checkin",
        10,
        True,
        None,
        1,
        "Daily check-in reward — one per calendar day",
    ),
    (
        "profile_name_set",
        25,
        True,
        1,
        None,
        "User sets their full name on the platform for the first time",
    ),
]


def upgrade() -> None:
    coin_rules_table = sa.table(
        "coin_rules",
        sa.column("event_type", sa.String),
        sa.column("coins_awarded", sa.Integer),
        sa.column("is_active", sa.Boolean),
        sa.column("max_per_user", sa.Integer),
        sa.column("cooldown_days", sa.Integer),
        sa.column("description", sa.Text),
    )
    for event_type, coins_awarded, is_active, max_per_user, cooldown_days, description in _NEW_RULES:
        op.execute(
            coin_rules_table.insert().values(
                event_type=event_type,
                coins_awarded=coins_awarded,
                is_active=is_active,
                max_per_user=max_per_user,
                cooldown_days=cooldown_days,
                description=description,
            )
        )


def downgrade() -> None:
    op.execute(
        "DELETE FROM coin_rules WHERE event_type IN ("
        "'client_onboarding_complete','first_booking','daily_checkin','profile_name_set'"
        ")"
    )
