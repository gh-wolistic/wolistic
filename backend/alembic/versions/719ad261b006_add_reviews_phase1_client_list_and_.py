"""add_reviews_phase1_client_list_and_responses

Revision ID: 719ad261b006
Revises: fce6354b0566
Create Date: 2026-04-13 10:33:11.140696

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '719ad261b006'
down_revision = 'fce6354b0566'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if expert_clients table exists, if not create it
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # 1. Create expert_clients table (client list management) - if not exists
    if 'expert_clients' not in tables:
        op.create_table(
            'expert_clients',
            sa.Column('id', sa.BigInteger(), nullable=False),
            sa.Column('professional_id', sa.UUID(), nullable=False),
            sa.Column('client_user_id', sa.UUID(), nullable=True),  # Nullable until they register
            sa.Column('client_name', sa.String(255), nullable=False),
            sa.Column('client_email', sa.String(255), nullable=False),
            sa.Column('service_notes', sa.Text(), nullable=True),  # What service/program
            sa.Column('status', sa.String(32), nullable=False, server_default='pending'),  # pending, registered, reviewed
            sa.Column('invite_token', sa.String(64), nullable=True),  # For invite link (Phase 2)
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['professional_id'], ['professionals.user_id'], ),
            sa.ForeignKeyConstraint(['client_user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('professional_id', 'client_email', name='unique_professional_client_email'),
        )
        op.create_index('idx_expert_clients_professional_id', 'expert_clients', ['professional_id'])
        op.create_index('idx_expert_clients_client_user_id', 'expert_clients', ['client_user_id'])
        op.create_index('idx_expert_clients_status', 'expert_clients', ['status'])

    # 2. Add columns to professional_reviews table - check each column first
    columns = [col['name'] for col in inspector.get_columns('professional_reviews')]
    
    if 'booking_id' not in columns:
        op.add_column('professional_reviews', sa.Column('booking_id', sa.BigInteger(), nullable=True))
        op.create_foreign_key('fk_professional_reviews_booking_id', 'professional_reviews', 'bookings', ['booking_id'], ['id'])
        op.create_index('idx_professional_reviews_booking_id', 'professional_reviews', ['booking_id'])
    
    if 'service_name' not in columns:
        op.add_column('professional_reviews', sa.Column('service_name', sa.String(255), nullable=True))
    
    if 'verification_type' not in columns:
        op.add_column('professional_reviews', sa.Column('verification_type', sa.String(32), nullable=False, server_default='wolistic_user'))
        op.create_index('idx_professional_reviews_verification_type', 'professional_reviews', ['verification_type'])
    
    if 'flagged_at' not in columns:
        op.add_column('professional_reviews', sa.Column('flagged_at', sa.DateTime(timezone=True), nullable=True))
    
    if 'flagged_by_user_id' not in columns:
        op.add_column('professional_reviews', sa.Column('flagged_by_user_id', sa.UUID(), nullable=True))
        op.create_foreign_key('fk_professional_reviews_flagged_by', 'professional_reviews', 'users', ['flagged_by_user_id'], ['id'])
    
    if 'flag_reason' not in columns:
        op.add_column('professional_reviews', sa.Column('flag_reason', sa.Text(), nullable=True))
    
    if 'moderation_status' not in columns:
        op.add_column('professional_reviews', sa.Column('moderation_status', sa.String(32), nullable=True))
        op.create_index('idx_professional_reviews_moderation_status', 'professional_reviews', ['moderation_status'])

    # 3. Create professional_review_responses table - if not exists
    if 'professional_review_responses' not in tables:
        op.create_table(
            'professional_review_responses',
            sa.Column('id', sa.BigInteger(), nullable=False),
            sa.Column('review_id', sa.BigInteger(), nullable=False),
            sa.Column('professional_id', sa.UUID(), nullable=False),
            sa.Column('response_text', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['review_id'], ['professional_reviews.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['professional_id'], ['professionals.user_id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('review_id', name='unique_review_response'),  # One response per review
        )
        op.create_index('idx_professional_review_responses_review_id', 'professional_review_responses', ['review_id'])
        op.create_index('idx_professional_review_responses_professional_id', 'professional_review_responses', ['professional_id'])


def downgrade() -> None:
    # Drop in reverse order
    op.drop_index('idx_professional_review_responses_professional_id', 'professional_review_responses')
    op.drop_index('idx_professional_review_responses_review_id', 'professional_review_responses')
    op.drop_table('professional_review_responses')

    op.drop_index('idx_professional_reviews_moderation_status', 'professional_reviews')
    op.drop_index('idx_professional_reviews_verification_type', 'professional_reviews')
    op.drop_index('idx_professional_reviews_booking_id', 'professional_reviews')
    op.drop_constraint('fk_professional_reviews_flagged_by', 'professional_reviews', type_='foreignkey')
    op.drop_constraint('fk_professional_reviews_booking_id', 'professional_reviews', type_='foreignkey')
    op.drop_column('professional_reviews', 'moderation_status')
    op.drop_column('professional_reviews', 'flag_reason')
    op.drop_column('professional_reviews', 'flagged_by_user_id')
    op.drop_column('professional_reviews', 'flagged_at')
    op.drop_column('professional_reviews', 'verification_type')
    op.drop_column('professional_reviews', 'service_name')
    op.drop_column('professional_reviews', 'booking_id')

    op.drop_index('idx_expert_clients_status', 'expert_clients')
    op.drop_index('idx_expert_clients_client_user_id', 'expert_clients')
    op.drop_index('idx_expert_clients_professional_id', 'expert_clients')
    op.drop_table('expert_clients')
