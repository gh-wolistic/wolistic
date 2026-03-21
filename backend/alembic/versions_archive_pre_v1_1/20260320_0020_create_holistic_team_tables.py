"""create holistic team tables

Revision ID: 20260320_0020
Revises: 20260320_0019
Create Date: 2026-03-20 23:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260320_0020"
down_revision: Union[str, None] = "20260320_0019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "holistic_teams",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("source_type", sa.String(length=32), nullable=False, server_default="engine_generated"),
        sa.Column("scope", sa.String(length=50), nullable=False, server_default="professionals"),
        sa.Column("query_tag", sa.Text(), nullable=True),
        sa.Column("keywords", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("pricing_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("pricing_currency", sa.String(length=8), nullable=False, server_default="INR"),
        sa.Column("mode", sa.String(length=20), nullable=False, server_default="online"),
        sa.Column("sessions_included_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("package_type", sa.String(length=30), nullable=False, server_default="consultation_only"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_holistic_teams_scope", "holistic_teams", ["scope"], unique=False)
    op.create_index("ix_holistic_teams_source_type", "holistic_teams", ["source_type"], unique=False)
    op.create_index("ix_holistic_teams_query_tag", "holistic_teams", ["query_tag"], unique=False)
    op.create_index("ix_holistic_teams_active_created", "holistic_teams", ["is_active", "created_at"], unique=False)

    op.create_table(
        "holistic_team_members",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("team_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("professional_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="other"),
        sa.Column("sessions_included", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["team_id"], ["holistic_teams.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("team_id", "professional_id", name="uq_holistic_team_member_unique"),
    )
    op.create_index("ix_holistic_team_members_team_id", "holistic_team_members", ["team_id"], unique=False)
    op.create_index(
        "ix_holistic_team_members_professional_id",
        "holistic_team_members",
        ["professional_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_holistic_team_members_professional_id", table_name="holistic_team_members")
    op.drop_index("ix_holistic_team_members_team_id", table_name="holistic_team_members")
    op.drop_table("holistic_team_members")

    op.drop_index("ix_holistic_teams_active_created", table_name="holistic_teams")
    op.drop_index("ix_holistic_teams_query_tag", table_name="holistic_teams")
    op.drop_index("ix_holistic_teams_source_type", table_name="holistic_teams")
    op.drop_index("ix_holistic_teams_scope", table_name="holistic_teams")
    op.drop_table("holistic_teams")
