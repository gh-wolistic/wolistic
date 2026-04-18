"""add professional verification system

Revision ID: q78r9s0t1u2v
Revises: p67q8r9s0t1u
Create Date: 2026-04-18 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "q78r9s0t1u2v"
down_revision: Union[str, None] = "p67q8r9s0t1u"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create credential_type enum (check first to avoid duplicate error)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE credential_type AS ENUM ('education', 'certificate', 'license');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create credential_subtype enum (check first to avoid duplicate error)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE credential_subtype AS ENUM (
                -- Education subtypes
                'bachelors', 'masters', 'phd', 'diploma',
                
                -- Certificate subtypes
                'yoga_certification', 'fitness_certification', 'nutrition_certification',
                'pilates_certification', 'meditation_certification',
                
                -- License subtypes (regulated professions)
                'medical_council_license', 'dietitian_license', 'physiotherapy_license',
                'psychologist_license', 'nursing_license'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # 1. Create professional_identity_verification table
    op.create_table(
        'professional_identity_verification',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_type', sa.String(32), nullable=False),
        sa.Column('document_url', sa.Text(), nullable=False),
        sa.Column('verification_status', sa.String(16), nullable=False, server_default='pending'),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('grace_period_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('document_deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        
        sa.PrimaryKeyConstraint('user_id'),
        sa.ForeignKeyConstraint(['user_id'], ['professionals.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['verified_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.CheckConstraint(
            "document_type IN ('aadhaar', 'passport', 'drivers_license', 'pan_card')",
            name='check_document_type'
        ),
        sa.CheckConstraint(
            "verification_status IN ('pending', 'approved', 'rejected')",
            name='check_verification_status'
        )
    )
    
    # Indexes for identity verification
    op.create_index(
        'ix_identity_verification_status',
        'professional_identity_verification',
        ['verification_status']
    )
    op.create_index(
        'ix_identity_verification_grace_period',
        'professional_identity_verification',
        ['grace_period_expires_at'],
        postgresql_where=sa.text("verification_status = 'pending'")
    )
    
    # 2. Create credential_verifications table
    op.create_table(
        'credential_verifications',
        sa.Column('id', sa.BigInteger(), nullable=False, autoincrement=True),
        sa.Column('professional_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('credential_type', postgresql.ENUM('education', 'certificate', 'license', name='credential_type', create_type=False), nullable=False),
        sa.Column('credential_subtype', postgresql.ENUM(
            'bachelors', 'masters', 'phd', 'diploma',
            'yoga_certification', 'fitness_certification', 'nutrition_certification',
            'pilates_certification', 'meditation_certification',
            'medical_council_license', 'dietitian_license', 'physiotherapy_license',
            'psychologist_license', 'nursing_license',
            name='credential_subtype', create_type=False
        ), nullable=True),
        sa.Column('credential_name', sa.String(255), nullable=False),
        sa.Column('issuing_organization', sa.String(255), nullable=False),
        sa.Column('issued_date', sa.Date(), nullable=True),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('license_number', sa.String(100), nullable=True),
        sa.Column('registry_link', sa.Text(), nullable=True),
        sa.Column('document_url', sa.Text(), nullable=True),
        sa.Column('verification_status', sa.String(16), nullable=False, server_default='pending'),
        sa.Column('verification_method', sa.String(64), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('expiry_warning_sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('auto_expired_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['professional_id'], ['professionals.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['verified_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.CheckConstraint(
            "verification_status IN ('pending', 'approved', 'rejected', 'expired', 'auto_verified')",
            name='check_credential_verification_status'
        ),
        sa.CheckConstraint(
            "verification_method IN ('manual', 'api_medical_council', 'api_dietitian_board', 'api_rci', 'api_yoga_alliance', 'api_digilocker')",
            name='check_verification_method'
        ),
        sa.UniqueConstraint('professional_id', 'credential_type', 'credential_name', 'issuing_organization',
                           name='uq_credential_verification')
    )
    
    # Indexes for credential verifications
    op.create_index(
        'ix_credential_verifications_professional',
        'credential_verifications',
        ['professional_id']
    )
    op.create_index(
        'ix_credential_verifications_status',
        'credential_verifications',
        ['verification_status']
    )
    op.create_index(
        'ix_credential_verifications_type',
        'credential_verifications',
        ['credential_type']
    )
    op.create_index(
        'ix_credential_verifications_license_expiry',
        'credential_verifications',
        ['expiry_date'],
        postgresql_where=sa.text("credential_type = 'license' AND expiry_date IS NOT NULL")
    )
    
    # 3. Create profession_license_requirements table
    op.create_table(
        'profession_license_requirements',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('profession', sa.String(64), nullable=False),
        sa.Column('credential_subtype', postgresql.ENUM(
            'bachelors', 'masters', 'phd', 'diploma',
            'yoga_certification', 'fitness_certification', 'nutrition_certification',
            'pilates_certification', 'meditation_certification',
            'medical_council_license', 'dietitian_license', 'physiotherapy_license',
            'psychologist_license', 'nursing_license',
            name='credential_subtype', create_type=False
        ), nullable=False),
        sa.Column('issuing_authority', sa.String(255), nullable=False),
        sa.Column('is_mandatory', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('registry_api_available', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('registry_api_endpoint', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        
        sa.PrimaryKeyConstraint('id')
    )
    
    # Seed data for regulated professions in India
    op.execute("""
        INSERT INTO profession_license_requirements (profession, credential_subtype, issuing_authority, is_mandatory, registry_api_available)
        VALUES
            ('doctor', 'medical_council_license', 'Medical Council of India', true, true),
            ('dietitian', 'dietitian_license', 'Indian Dietetic Association', true, false),
            ('physiotherapist', 'physiotherapy_license', 'Indian Association of Physiotherapists', true, false),
            ('psychologist', 'psychologist_license', 'Rehabilitation Council of India', true, true),
            ('nurse', 'nursing_license', 'State Nursing Council', true, false),
            ('yoga_instructor', 'yoga_certification', 'Yoga Alliance', false, true)
    """)
    
    # 4. Add profession_type column to professionals table
    op.add_column(
        'professionals',
        sa.Column('profession_type', sa.String(64), nullable=True)
    )
    
    # Create index on profession_type for efficient license requirement lookups
    op.create_index(
        'ix_professionals_profession_type',
        'professionals',
        ['profession_type']
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_professionals_profession_type', table_name='professionals')
    op.drop_index('ix_credential_verifications_license_expiry', table_name='credential_verifications')
    op.drop_index('ix_credential_verifications_type', table_name='credential_verifications')
    op.drop_index('ix_credential_verifications_status', table_name='credential_verifications')
    op.drop_index('ix_credential_verifications_professional', table_name='credential_verifications')
    op.drop_index('ix_identity_verification_grace_period', table_name='professional_identity_verification')
    op.drop_index('ix_identity_verification_status', table_name='professional_identity_verification')
    
    # Drop column
    op.drop_column('professionals', 'profession_type')
    
    # Drop tables
    op.drop_table('profession_license_requirements')
    op.drop_table('credential_verifications')
    op.drop_table('professional_identity_verification')
    
    # Drop enums
    op.execute('DROP TYPE credential_subtype')
    op.execute('DROP TYPE credential_type')
