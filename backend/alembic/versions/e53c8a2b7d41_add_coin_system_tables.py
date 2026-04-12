"""add coin system tables

Revision ID: e53c8a2b7d41
Revises: d42b5f3a1c90
Create Date: 2026-04-11 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "e53c8a2b7d41"
down_revision = "d42b5f3a1c90"
branch_labels = None
depends_on = None

# ---------------------------------------------------------------------------
# Default coin rules seeded on first migration.
# Each tuple: (event_type, coins_awarded, is_active, max_per_user, description)
# ---------------------------------------------------------------------------
_DEFAULT_RULES: list[tuple[str, int, bool, int | None, str]] = [
    ("welcome_bonus",        100,  True,  1,    "Awarded once when a user completes onboarding"),
    ("booking_cashback",      50,  True,  None, "Client earns coins for each confirmed booking"),
    ("session_complete",      75,  True,  None, "Partner earns coins for each confirmed session"),
    ("profile_milestone_50", 100,  True,  1,    "Partner profile reaches 50% completeness"),
    ("profile_milestone_75", 150,  True,  1,    "Partner profile reaches 75% completeness"),
    ("profile_milestone_100",250,  True,  1,    "Partner profile reaches 100% completeness"),
    ("profile_verified",     500,  True,  1,    "Admin approves a partner professional account"),
    ("review_received",       30,  True,  None, "Partner earns coins when they receive a review"),
    ("review_given",          20,  True,  None, "Client earns coins for submitting a review"),
    ("referral_partner",    1000,  False, None, "Reserved — partner referral programme (inactive)"),
    ("referral_client",      200,  False, None, "Reserved — client referral programme (inactive)"),
]


def upgrade() -> None:
    # ------------------------------------------------------------------
    # coin_wallets — cached balance per user
    # ------------------------------------------------------------------
    op.create_table(
        "coin_wallets",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lifetime_earned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lifetime_redeemed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    # ------------------------------------------------------------------
    # coin_transactions — append-only ledger
    # ------------------------------------------------------------------
    op.create_table(
        "coin_transactions",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("reference_type", sa.String(length=64), nullable=True),
        sa.Column("reference_id", sa.String(length=128), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        # Idempotency — NULLs in reference_type/reference_id are excluded from
        # the unique check by PostgreSQL, which is exactly what we want for
        # multi-instance admin_adjustment rows.
        sa.UniqueConstraint(
            "user_id",
            "event_type",
            "reference_type",
            "reference_id",
            name="uq_coin_txn_idempotency",
        ),
    )
    op.create_index("ix_coin_transactions_user_id", "coin_transactions", ["user_id"], unique=False)
    op.create_index(
        "ix_coin_transactions_user_created",
        "coin_transactions",
        ["user_id", sa.text("created_at DESC")],
        unique=False,
    )
    op.create_index("ix_coin_transactions_event_type", "coin_transactions", ["event_type"], unique=False)

    # ------------------------------------------------------------------
    # coin_rules — admin-configurable earn rates
    # ------------------------------------------------------------------
    op.create_table(
        "coin_rules",
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("coins_awarded", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("max_per_user", sa.Integer(), nullable=True),
        sa.Column("cooldown_days", sa.Integer(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("event_type"),
    )

    # ------------------------------------------------------------------
    # Seed default rules
    # ------------------------------------------------------------------
    coin_rules_table = sa.table(
        "coin_rules",
        sa.column("event_type", sa.String),
        sa.column("coins_awarded", sa.Integer),
        sa.column("is_active", sa.Boolean),
        sa.column("max_per_user", sa.Integer),
        sa.column("description", sa.String),
    )
    op.bulk_insert(
        coin_rules_table,
        [
            {
                "event_type": event_type,
                "coins_awarded": coins,
                "is_active": is_active,
                "max_per_user": max_per_user,
                "description": description,
            }
            for event_type, coins, is_active, max_per_user, description in _DEFAULT_RULES
        ],
    )


def downgrade() -> None:
    op.drop_table("coin_rules")
    op.drop_index("ix_coin_transactions_event_type", table_name="coin_transactions")
    op.drop_index("ix_coin_transactions_user_created", table_name="coin_transactions")
    op.drop_index("ix_coin_transactions_user_id", table_name="coin_transactions")
    op.drop_table("coin_transactions")
    op.drop_table("coin_wallets")
