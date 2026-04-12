"""add subscription payment and ticket tables

Revision ID: k67m8n9o1p2q
Revises: j56l7m8n9o0p
Create Date: 2025-01-01 00:00:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "k67m8n9o1p2q"
down_revision = "j56l7m8n9o0p"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "subscription_payment_orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("professional_id", sa.UUID(as_uuid=True), sa.ForeignKey("professionals.user_id"), nullable=False),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("subscription_plans.id"), nullable=False),
        sa.Column("provider_order_id", sa.String(), nullable=False, unique=True),
        sa.Column("amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="INR"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="created"),
        sa.Column("provider_payment_id", sa.String(), nullable=True),
        sa.Column("provider_signature", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_sub_payment_orders_professional_id", "subscription_payment_orders", ["professional_id"])
    op.create_index("ix_sub_payment_orders_provider_order_id", "subscription_payment_orders", ["provider_order_id"], unique=True)

    op.create_table(
        "subscription_priority_tickets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("professional_id", sa.UUID(as_uuid=True), sa.ForeignKey("professionals.user_id"), nullable=False),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("subscription_plans.id"), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_sub_priority_tickets_professional_id", "subscription_priority_tickets", ["professional_id"])


def downgrade() -> None:
    op.drop_index("ix_sub_priority_tickets_professional_id", table_name="subscription_priority_tickets")
    op.drop_table("subscription_priority_tickets")

    op.drop_index("ix_sub_payment_orders_provider_order_id", table_name="subscription_payment_orders")
    op.drop_index("ix_sub_payment_orders_professional_id", table_name="subscription_payment_orders")
    op.drop_table("subscription_payment_orders")
