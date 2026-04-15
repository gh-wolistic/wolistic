"""add_offers_table

Revision ID: 3d6c0cd07c7a
Revises: l01m2n3o4p5q
Create Date: 2026-04-15 13:50:13.467488

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID



# revision identifiers, used by Alembic.
revision = '3d6c0cd07c7a'
down_revision = 'l01m2n3o4p5q'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create offers table (idempotent - check if exists first)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'offers' not in inspector.get_table_names():
        op.create_table(
            'offers',
            sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column('code', sa.String(50), unique=True, nullable=False, index=True),
            sa.Column('name', sa.String(200), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('offer_type', sa.String(32), nullable=False, index=True),
            sa.Column('domain', sa.String(32), nullable=False, default='subscription', index=True),
            
            # Tier upgrade fields
            sa.Column('target_tier', sa.String(32), nullable=True),
            sa.Column('duration_months', sa.Integer(), nullable=True),
            sa.Column('auto_downgrade_after_months', sa.Integer(), nullable=True),
            sa.Column('downgrade_to_tier', sa.String(32), nullable=True),
            
            # Discount fields (for future service-level offers)
            sa.Column('discount_type', sa.String(32), nullable=True),
            sa.Column('discount_value', sa.Numeric(10, 2), nullable=True),
            
            # Usage limits
            sa.Column('max_redemptions', sa.Integer(), nullable=True),
            sa.Column('max_redemptions_per_professional', sa.Integer(), nullable=True, default=1),
            
            # Validity period
            sa.Column('valid_from', sa.TIMESTAMP(timezone=True), nullable=False),
            sa.Column('valid_until', sa.TIMESTAMP(timezone=True), nullable=True),
            
            # Audit
            sa.Column('created_by', UUID(as_uuid=True), nullable=True),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
            sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        )
    
    # Additional indexes not already created by column-level index=True (using IF NOT EXISTS)
    op.execute('CREATE INDEX IF NOT EXISTS ix_offers_valid_from ON offers (valid_from)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_offers_valid_until ON offers (valid_until)')


def downgrade() -> None:
    op.drop_table('offers')
