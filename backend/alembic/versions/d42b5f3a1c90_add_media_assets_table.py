"""add media assets table

Revision ID: d42b5f3a1c90
Revises: c3d9f0a4e8b2
Create Date: 2026-03-23 10:15:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "d42b5f3a1c90"
down_revision = "c3d9f0a4e8b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "media_assets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("bucket_id", sa.String(length=128), nullable=False),
        sa.Column("object_path", sa.Text(), nullable=False),
        sa.Column("surface", sa.String(length=32), nullable=False),
        sa.Column("mime_type", sa.String(length=127), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("bucket_id", "object_path", name="uq_media_assets_bucket_object"),
    )
    op.create_index("ix_media_assets_owner_user_id", "media_assets", ["owner_user_id"], unique=False)
    op.create_index("ix_media_assets_owner_surface", "media_assets", ["owner_user_id", "surface"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_media_assets_owner_surface", table_name="media_assets")
    op.drop_index("ix_media_assets_owner_user_id", table_name="media_assets")
    op.drop_table("media_assets")
