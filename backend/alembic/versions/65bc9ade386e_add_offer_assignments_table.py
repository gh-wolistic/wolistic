"""add_offer_assignments_table

Revision ID: 65bc9ade386e
Revises: 3d6c0cd07c7a
Create Date: 2026-04-15 13:50:54.975813

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID



# revision identifiers, used by Alembic.
revision = '65bc9ade386e'
down_revision = '3d6c0cd07c7a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create offer_assignments table (ledger-based audit trail) - idempotent
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'offer_assignments' not in inspector.get_table_names():
        op.create_table(
            'offer_assignments',
            sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column('offer_id', sa.BigInteger(), sa.ForeignKey('offers.id', ondelete='RESTRICT'), nullable=False, index=True),
            sa.Column('professional_id', UUID(as_uuid=True), sa.ForeignKey('professionals.user_id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('assigned_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            
            # Status tracking
            sa.Column('status', sa.String(32), nullable=False, default='pending', index=True),
            # Status: pending (assigned but not activated), active (currently in effect), 
            #         redeemed (successfully used), expired (validity period ended), 
            #         revoked (manually cancelled by admin)
            
            # Timestamps
            sa.Column('assigned_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('activated_at', sa.TIMESTAMP(timezone=True), nullable=True),
            sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=True),
            sa.Column('redeemed_at', sa.TIMESTAMP(timezone=True), nullable=True),
            sa.Column('revoked_at', sa.TIMESTAMP(timezone=True), nullable=True),
            
            # Audit
            sa.Column('revoked_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            sa.Column('revoke_reason', sa.Text(), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
        )
    
    # Additional indexes not already created by column-level index=True (using IF NOT EXISTS)
    op.execute('CREATE INDEX IF NOT EXISTS ix_offer_assignments_assigned_by ON offer_assignments (assigned_by)')
    
    # Composite index for common query: active assignments for a professional
    op.execute('CREATE INDEX IF NOT EXISTS ix_offer_assignments_professional_status ON offer_assignments (professional_id, status)')


def downgrade() -> None:
    op.drop_table('offer_assignments')
