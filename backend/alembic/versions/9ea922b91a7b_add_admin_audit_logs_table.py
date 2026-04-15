"""add_admin_audit_logs_table

Revision ID: 9ea922b91a7b
Revises: 529aad72bfd6
Create Date: 2026-04-15 18:43:51.466561

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '9ea922b91a7b'
down_revision = '529aad72bfd6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create admin_audit_logs table for P0 compliance tracking."""
    op.create_table(
        'admin_audit_logs',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False, comment='Action performed (e.g., approve_professional, update_tier)'),
        sa.Column('resource_type', sa.String(length=50), nullable=False, comment='Type of resource affected (e.g., professional, offer)'),
        sa.Column('resource_id', sa.String(length=255), nullable=False, comment='ID of the affected resource'),
        sa.Column('admin_email', sa.String(length=255), nullable=False, comment='Email of admin who performed the action'),
        sa.Column('request_method', sa.String(length=10), nullable=False, comment='HTTP method (POST, PATCH, DELETE)'),
        sa.Column('request_path', sa.Text(), nullable=False, comment='Full request path'),
        sa.Column('payload', JSONB(astext_type=sa.Text()), nullable=True, comment='Request body or relevant action parameters (JSON)'),
        sa.Column('client_ip', sa.String(length=45), nullable=True, comment='IP address of client (IPv4 or IPv6)'),
        sa.Column('user_agent', sa.String(length=500), nullable=True, comment='Browser user agent string'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='When the action was performed'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for common query patterns
    op.create_index('ix_admin_audit_logs_created_at', 'admin_audit_logs', ['created_at'], unique=False)
    op.create_index('ix_admin_audit_logs_admin_email', 'admin_audit_logs', ['admin_email'], unique=False)
    op.create_index('ix_admin_audit_logs_resource_type', 'admin_audit_logs', ['resource_type'], unique=False)
    op.create_index('ix_admin_audit_logs_resource_id', 'admin_audit_logs', ['resource_id'], unique=False)
    op.create_index('ix_admin_audit_logs_action', 'admin_audit_logs', ['action'], unique=False)


def downgrade() -> None:
    """Drop admin_audit_logs table."""
    op.drop_index('ix_admin_audit_logs_action', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_resource_id', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_resource_type', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_admin_email', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_created_at', table_name='admin_audit_logs')
    op.drop_table('admin_audit_logs')

