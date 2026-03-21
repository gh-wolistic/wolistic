"""create professional featured index table

Revision ID: 20260320_0019
Revises: 20260320_0018
Create Date: 2026-03-20 22:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260320_0019"
down_revision: Union[str, None] = "20260320_0018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "professional_featured_index",
        sa.Column("professional_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sort_rank", sa.Integer(), nullable=False),
        sa.Column("rank_score", sa.Numeric(), nullable=False, server_default="0"),
        sa.Column("membership_tier", sa.String(length=32), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("professional_id"),
    )
    op.create_index(
        "ix_professional_featured_index_sort_rank",
        "professional_featured_index",
        ["sort_rank"],
        unique=False,
    )
    op.create_index(
        "ix_professional_featured_index_updated_at",
        "professional_featured_index",
        ["updated_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_professional_featured_index_updated_at", table_name="professional_featured_index")
    op.drop_index("ix_professional_featured_index_sort_rank", table_name="professional_featured_index")
    op.drop_table("professional_featured_index")
