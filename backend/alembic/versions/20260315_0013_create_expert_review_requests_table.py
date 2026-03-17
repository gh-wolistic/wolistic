"""create expert_review_requests table

Revision ID: 20260315_0013
Revises: 20260314_0012
Create Date: 2026-03-15 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260315_0013"
down_revision: Union[str, None] = "20260314_0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "expert_review_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("query", sa.Text(), nullable=True),
        sa.Column("scope", sa.String(50), nullable=True),
        sa.Column("answers", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("status", sa.String(30), nullable=False, server_default="received"),
        sa.Column("source", sa.String(60), nullable=False, server_default="expert_review_chat"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_expert_review_requests_user_id", "expert_review_requests", ["user_id"])
    op.create_index("ix_expert_review_requests_status", "expert_review_requests", ["status"])


def downgrade() -> None:
    op.drop_index("ix_expert_review_requests_status", table_name="expert_review_requests")
    op.drop_index("ix_expert_review_requests_user_id", table_name="expert_review_requests")
    op.drop_table("expert_review_requests")
