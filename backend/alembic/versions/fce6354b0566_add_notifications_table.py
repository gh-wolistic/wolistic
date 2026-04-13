"""Add notifications table

Revision ID: fce6354b0566
Revises: p67q8r9s0t1u
Create Date: 2026-04-13 09:38:24.571315

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID



# revision identifiers, used by Alembic.
revision = 'fce6354b0566'
down_revision = 'p67q8r9s0t1u'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'notifications',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(length=32), nullable=False, comment='Notification type: message, lead, schedule, followup, system'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('action_url', sa.String(length=512), nullable=True),
        sa.Column('action_text', sa.String(length=100), nullable=True),
        sa.Column('extra_data', JSONB(astext_type=sa.Text()), nullable=True, comment='Additional notification data (avatar, sender_id, etc.)'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'], unique=False)
    op.create_index('ix_notifications_type', 'notifications', ['type'], unique=False)
    op.create_index('ix_notifications_read', 'notifications', ['read'], unique=False)
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_notifications_created_at', table_name='notifications')
    op.drop_index('ix_notifications_read', table_name='notifications')
    op.drop_index('ix_notifications_type', table_name='notifications')
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_table('notifications')
