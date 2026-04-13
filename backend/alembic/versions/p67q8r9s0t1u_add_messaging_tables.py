"""add messaging tables

Revision ID: p67q8r9s0t1u
Revises: o01q2r3s4t5u
Create Date: 2026-04-13 10:00:00.000000

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "p67q8r9s0t1u"
down_revision = "o01q2r3s4t5u"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- conversations ---------------------------------------------------
    op.create_table(
        "conversations",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("extra_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_conversations_updated_at",
        "conversations",
        ["updated_at"],
        postgresql_using="btree",
    )
    op.create_index(
        "ix_conversations_last_message_at",
        "conversations",
        ["last_message_at"],
        postgresql_using="btree",
    )

    # --- conversation_participants ---------------------------------------
    op.create_table(
        "conversation_participants",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("conversation_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_read_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("conversation_id", "user_id", name="uq_conversation_participant"),
    )
    op.create_index("ix_conversation_participants_user_id", "conversation_participants", ["user_id"])
    op.create_index("ix_conversation_participants_conversation_id", "conversation_participants", ["conversation_id"])

    # --- messages --------------------------------------------------------
    op.create_table(
        "messages",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("conversation_id", sa.UUID(), nullable=False),
        sa.Column("sender_id", sa.UUID(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
        sa.CheckConstraint("char_length(content) > 0", name="ck_messages_content_not_empty"),
    )
    op.create_index(
        "ix_messages_conversation_created",
        "messages",
        ["conversation_id", "created_at"],
        postgresql_using="btree",
    )
    op.create_index("ix_messages_sender_id", "messages", ["sender_id"])


def downgrade() -> None:
    op.drop_index("ix_messages_sender_id", table_name="messages")
    op.drop_index("ix_messages_conversation_created", table_name="messages")
    op.drop_table("messages")

    op.drop_index("ix_conversation_participants_conversation_id", table_name="conversation_participants")
    op.drop_index("ix_conversation_participants_user_id", table_name="conversation_participants")
    op.drop_table("conversation_participants")

    op.drop_index("ix_conversations_last_message_at", table_name="conversations")
    op.drop_index("ix_conversations_updated_at", table_name="conversations")
    op.drop_table("conversations")
