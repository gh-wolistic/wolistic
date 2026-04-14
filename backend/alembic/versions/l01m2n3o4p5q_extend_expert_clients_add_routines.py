"""extend_expert_clients_add_routines

Revision ID: l01m2n3o4p5q
Revises: 719ad261b006
Create Date: 2026-04-14 15:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'l01m2n3o4p5q'
down_revision = '719ad261b006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to expert_clients table
    op.add_column('expert_clients', sa.Column('goals', sa.Text(), nullable=True))
    op.add_column('expert_clients', sa.Column('preferences', sa.Text(), nullable=True))
    op.add_column('expert_clients', sa.Column('medical_history', sa.Text(), nullable=True))
    op.add_column('expert_clients', sa.Column('dietary_requirements', sa.Text(), nullable=True))
    op.add_column('expert_clients', sa.Column('age', sa.Integer(), nullable=True))
    op.add_column('expert_clients', sa.Column('height_cm', sa.Integer(), nullable=True))
    op.add_column('expert_clients', sa.Column('weight_kg', sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column('expert_clients', sa.Column('acquisition_source', sa.String(length=50), server_default='expert_invite', nullable=False))
    op.add_column('expert_clients', sa.Column('source_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('expert_clients', sa.Column('total_sessions', sa.Integer(), server_default='0', nullable=False))
    op.add_column('expert_clients', sa.Column('completed_sessions', sa.Integer(), server_default='0', nullable=False))
    op.add_column('expert_clients', sa.Column('attendance_count', sa.Integer(), server_default='0', nullable=False))
    op.add_column('expert_clients', sa.Column('current_streak_weeks', sa.Integer(), server_default='0', nullable=False))
    op.add_column('expert_clients', sa.Column('lifetime_value', sa.Numeric(precision=10, scale=2), server_default='0', nullable=False))
    op.add_column('expert_clients', sa.Column('enrolled_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))
    
    # Update status column constraint
    op.alter_column('expert_clients', 'status',
               existing_type=sa.VARCHAR(length=16),
               type_=sa.String(length=16),
               existing_nullable=False)
    
    # Add new constraints
    op.create_check_constraint('ck_expert_clients_status', 'expert_clients', "status IN ('active', 'paused', 'archived')")
    op.create_check_constraint('ck_expert_clients_acquisition_source', 'expert_clients', 
                              "acquisition_source IN ('expert_invite', 'organic_search', 'corporate_event', 'wolistic_recommendation', 'wolistic_lead')")
    
    # Add new indexes
    op.create_index('ix_expert_clients_status', 'expert_clients', ['status'], unique=False)
    op.create_index('ix_expert_clients_professional_status', 'expert_clients', ['professional_id', 'status'], unique=False)
    
    # Add resolved_at to expert_client_followups
    op.add_column('expert_client_followups', sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True))
    op.create_index('ix_expert_client_followups_due_date', 'expert_client_followups', ['due_date'], unique=False)
    op.create_index('ix_expert_client_followups_resolved', 'expert_client_followups', ['resolved'], unique=False)
    op.create_index('ix_expert_client_followups_professional_resolved', 'expert_client_followups', ['professional_id', 'resolved'], unique=False)
    
    # Create expert_client_routines table
    op.create_table('expert_client_routines',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('professional_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('client_id', sa.BigInteger(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='draft', nullable=False),
        sa.Column('source_type', sa.String(length=20), server_default='manual', nullable=False),
        sa.Column('is_template', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('template_id', sa.BigInteger(), nullable=True),
        sa.Column('duration_weeks', sa.Integer(), server_default='4', nullable=False),
        sa.Column('current_week', sa.Integer(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('draft', 'under_review', 'approved', 'published', 'archived')", name='ck_expert_client_routines_status'),
        sa.CheckConstraint("source_type IN ('manual', 'ai_generated')", name='ck_expert_client_routines_source_type'),
        sa.ForeignKeyConstraint(['client_id'], ['expert_clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['expert_client_routines.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_expert_client_routines_client_id', 'expert_client_routines', ['client_id'], unique=False)
    op.create_index('ix_expert_client_routines_is_template', 'expert_client_routines', ['is_template'], unique=False)
    op.create_index('ix_expert_client_routines_professional_id', 'expert_client_routines', ['professional_id'], unique=False)
    op.create_index('ix_expert_client_routines_professional_template', 'expert_client_routines', ['professional_id', 'is_template'], unique=False)
    op.create_index('ix_expert_client_routines_status', 'expert_client_routines', ['status'], unique=False)
    
    # Create expert_client_routine_items table
    op.create_table('expert_client_routine_items',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('routine_id', sa.BigInteger(), nullable=False),
        sa.Column('item_type', sa.String(length=20), nullable=False),
        sa.Column('order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('sets', sa.Integer(), nullable=True),
        sa.Column('reps', sa.Integer(), nullable=True),
        sa.Column('rest_seconds', sa.Integer(), nullable=True),
        sa.Column('intensity', sa.String(length=20), nullable=True),
        sa.Column('meal_type', sa.String(length=20), nullable=True),
        sa.Column('calories', sa.Integer(), nullable=True),
        sa.Column('completed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("intensity IN ('light', 'moderate', 'intense')", name='ck_expert_client_routine_items_intensity'),
        sa.CheckConstraint("item_type IN ('exercise', 'hydration', 'mobility', 'meal')", name='ck_expert_client_routine_items_type'),
        sa.ForeignKeyConstraint(['routine_id'], ['expert_client_routines.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_expert_client_routine_items_routine_id', 'expert_client_routine_items', ['routine_id'], unique=False)
    op.create_index('ix_expert_client_routine_items_routine_order', 'expert_client_routine_items', ['routine_id', 'order'], unique=False)
    op.create_index('ix_expert_client_routine_items_type', 'expert_client_routine_items', ['item_type'], unique=False)


def downgrade() -> None:
    # Drop expert_client_routine_items table
    op.drop_index('ix_expert_client_routine_items_type', table_name='expert_client_routine_items')
    op.drop_index('ix_expert_client_routine_items_routine_order', table_name='expert_client_routine_items')
    op.drop_index('ix_expert_client_routine_items_routine_id', table_name='expert_client_routine_items')
    op.drop_table('expert_client_routine_items')
    
    # Drop expert_client_routines table
    op.drop_index('ix_expert_client_routines_status', table_name='expert_client_routines')
    op.drop_index('ix_expert_client_routines_professional_template', table_name='expert_client_routines')
    op.drop_index('ix_expert_client_routines_professional_id', table_name='expert_client_routines')
    op.drop_index('ix_expert_client_routines_is_template', table_name='expert_client_routines')
    op.drop_index('ix_expert_client_routines_client_id', table_name='expert_client_routines')
    op.drop_table('expert_client_routines')
    
    # Drop followups indexes and columns
    op.drop_index('ix_expert_client_followups_professional_resolved', table_name='expert_client_followups')
    op.drop_index('ix_expert_client_followups_resolved', table_name='expert_client_followups')
    op.drop_index('ix_expert_client_followups_due_date', table_name='expert_client_followups')
    op.drop_column('expert_client_followups', 'resolved_at')
    
    # Drop expert_clients new indexes and constraints
    op.drop_index('ix_expert_clients_professional_status', table_name='expert_clients')
    op.drop_index('ix_expert_clients_status', table_name='expert_clients')
    op.drop_constraint('ck_expert_clients_acquisition_source', 'expert_clients', type_='check')
    op.drop_constraint('ck_expert_clients_status', 'expert_clients', type_='check')
    
    # Drop expert_clients new columns
    op.drop_column('expert_clients', 'enrolled_date')
    op.drop_column('expert_clients', 'lifetime_value')
    op.drop_column('expert_clients', 'current_streak_weeks')
    op.drop_column('expert_clients', 'attendance_count')
    op.drop_column('expert_clients', 'completed_sessions')
    op.drop_column('expert_clients', 'total_sessions')
    op.drop_column('expert_clients', 'source_metadata')
    op.drop_column('expert_clients', 'acquisition_source')
    op.drop_column('expert_clients', 'weight_kg')
    op.drop_column('expert_clients', 'height_cm')
    op.drop_column('expert_clients', 'age')
    op.drop_column('expert_clients', 'dietary_requirements')
    op.drop_column('expert_clients', 'medical_history')
    op.drop_column('expert_clients', 'preferences')
    op.drop_column('expert_clients', 'goals')
