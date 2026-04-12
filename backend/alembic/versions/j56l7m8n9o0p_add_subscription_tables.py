"""add subscription tables

Revision ID: j56l7m8n9o0p
Revises: i45k6l7m8n9o
Create Date: 2025-01-01 00:00:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "j56l7m8n9o0p"
down_revision = "i45k6l7m8n9o"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # subscription_plans
    op.create_table(
        "subscription_plans",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("expert_type", sa.String(length=32), nullable=False, server_default="all"),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("tier", sa.String(length=32), nullable=False, server_default="free"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price_monthly", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("price_yearly", sa.Numeric(10, 2), nullable=True),
        sa.Column("features", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("limits", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_subscription_plans_expert_type", "subscription_plans", ["expert_type"])

    # professional_subscriptions
    op.create_table(
        "professional_subscriptions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("professional_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("plan_id", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("auto_renew", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["subscription_plans.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("professional_id"),
    )
    op.create_index("ix_professional_subscriptions_professional_id", "professional_subscriptions", ["professional_id"])
    op.create_index("ix_professional_subscriptions_plan_id", "professional_subscriptions", ["plan_id"])

    # subscription_billing_records
    op.create_table(
        "subscription_billing_records",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("professional_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("plan_id", sa.BigInteger(), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False, server_default="INR"),
        sa.Column("method", sa.String(length=64), nullable=True),
        sa.Column("invoice_ref", sa.String(length=255), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["subscription_plans.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_subscription_billing_records_professional_id", "subscription_billing_records", ["professional_id"])
    op.create_index("ix_subscription_billing_records_plan_id", "subscription_billing_records", ["plan_id"])


def downgrade() -> None:
    op.drop_table("subscription_billing_records")
    op.drop_table("professional_subscriptions")
    op.drop_table("subscription_plans")
