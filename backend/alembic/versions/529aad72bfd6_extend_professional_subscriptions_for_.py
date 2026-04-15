"""extend_professional_subscriptions_for_offers

Revision ID: 529aad72bfd6
Revises: 65bc9ade386e
Create Date: 2026-04-15 13:51:38.338641

"""
from alembic import op
import sqlalchemy as sa



# revision identifiers, used by Alembic.
revision = '529aad72bfd6'
down_revision = '65bc9ade386e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add offer-related columns to professional_subscriptions (idempotent)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('professional_subscriptions')]
    
    # Link to offer assignment (nullable - only set for offer-based subscriptions)
    if 'offer_assignment_id' not in existing_columns:
        op.add_column(
            'professional_subscriptions',
            sa.Column('offer_assignment_id', sa.BigInteger(), sa.ForeignKey('offer_assignments.id', ondelete='SET NULL'), nullable=True)
        )
    
    # Subscription type enum to distinguish payment source
    # Values: 'self_paid' (professional paid), 'admin_upgrade' (admin manually set tier), 
    #         'offer_redemption' (tier via offer), 'partner_sponsored' (future: corporate tie-ups)
    if 'subscription_type' not in existing_columns:
        op.add_column(
            'professional_subscriptions',
            sa.Column('subscription_type', sa.String(32), nullable=True, default='self_paid')
        )
    
    # Auto-downgrade timestamp for time-limited offers
    if 'auto_downgrade_at' not in existing_columns:
        op.add_column(
            'professional_subscriptions',
            sa.Column('auto_downgrade_at', sa.TIMESTAMP(timezone=True), nullable=True)
        )
    
    # Downgrade target tier (e.g., 'free' after trial ends)
    if 'auto_downgrade_to_tier' not in existing_columns:
        op.add_column(
            'professional_subscriptions',
            sa.Column('auto_downgrade_to_tier', sa.String(32), nullable=True)
        )
    
    # Create indexes (using IF NOT EXISTS)
    op.execute('CREATE INDEX IF NOT EXISTS ix_professional_subscriptions_offer_assignment_id ON professional_subscriptions (offer_assignment_id)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_professional_subscriptions_subscription_type ON professional_subscriptions (subscription_type)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_professional_subscriptions_auto_downgrade_at ON professional_subscriptions (auto_downgrade_at)')
    
    # Backfill existing subscriptions with default subscription_type
    op.execute("UPDATE professional_subscriptions SET subscription_type = 'self_paid' WHERE subscription_type IS NULL")
    
    # Make subscription_type non-nullable after backfill (check if already non-nullable)
    result = conn.execute(sa.text("""
        SELECT is_nullable FROM information_schema.columns 
        WHERE table_name = 'professional_subscriptions' AND column_name = 'subscription_type'
    """))
    row = result.fetchone()
    if row and row[0] == 'YES':
        op.alter_column('professional_subscriptions', 'subscription_type', nullable=False)


def downgrade() -> None:
    op.drop_index('ix_professional_subscriptions_auto_downgrade_at', 'professional_subscriptions')
    op.drop_index('ix_professional_subscriptions_subscription_type', 'professional_subscriptions')
    op.drop_index('ix_professional_subscriptions_offer_assignment_id', 'professional_subscriptions')
    
    op.drop_column('professional_subscriptions', 'auto_downgrade_to_tier')
    op.drop_column('professional_subscriptions', 'auto_downgrade_at')
    op.drop_column('professional_subscriptions', 'subscription_type')
    op.drop_column('professional_subscriptions', 'offer_assignment_id')
