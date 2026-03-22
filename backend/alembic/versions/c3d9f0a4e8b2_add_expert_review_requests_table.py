"""add expert review requests table

Revision ID: c3d9f0a4e8b2
Revises: b7f42c9d1a61
Create Date: 2026-03-22 22:35:00.000000
"""

from __future__ import annotations

from alembic import op


# revision identifiers, used by Alembic.
revision = "c3d9f0a4e8b2"
down_revision = "b7f42c9d1a61"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS expert_review_requests (
            id UUID PRIMARY KEY,
            user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
            query TEXT NULL,
            scope VARCHAR(50) NULL,
            answers JSONB NOT NULL DEFAULT '{}'::jsonb,
            status VARCHAR(30) NOT NULL DEFAULT 'received',
            source VARCHAR(60) NOT NULL DEFAULT 'expert_review_chat',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_expert_review_requests_user_id ON expert_review_requests(user_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_expert_review_requests_status ON expert_review_requests(status)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_expert_review_requests_status")
    op.execute("DROP INDEX IF EXISTS ix_expert_review_requests_user_id")
    op.execute("DROP TABLE IF EXISTS expert_review_requests")
