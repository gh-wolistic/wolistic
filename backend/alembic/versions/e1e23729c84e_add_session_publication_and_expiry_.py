"""add session publication and expiry features

Revision ID: e1e23729c84e
Revises: 252a3e218f1c
Create Date: 2026-04-16 05:54:13.128814

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql



# revision identifiers, used by Alembic.
revision = 'e1e23729c84e'
down_revision = '252a3e218f1c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Extend group_classes with expiry and display term ─────────────────
    op.add_column(
        "group_classes",
        sa.Column("display_term", sa.String(16), nullable=False, server_default="session"),
    )
    op.add_column(
        "group_classes",
        sa.Column("expires_on", sa.Date(), nullable=True),  # Nullable for now, we'll set defaults
    )
    op.add_column(
        "group_classes",
        sa.Column("expired_action_taken", sa.String(16), nullable=True),
    )
    
    # Set default expiry date for existing classes (3 months from now)
    op.execute(
        """
        UPDATE group_classes 
        SET expires_on = CURRENT_DATE + INTERVAL '3 months'
        WHERE expires_on IS NULL
        """
    )
    
    # Make expires_on NOT NULL after setting defaults
    op.alter_column("group_classes", "expires_on", nullable=False)

    # ── 2. Extend class_sessions with publication workflow ───────────────────
    op.add_column(
        "class_sessions",
        sa.Column("status", sa.String(16), nullable=False, server_default="draft"),
    )
    op.add_column(
        "class_sessions",
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "class_sessions",
        sa.Column("is_locked", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "class_sessions",
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
    )
    
    # Migrate existing sessions to "published" status (backward compatibility)
    op.execute(
        """
        UPDATE class_sessions 
        SET status = 'published', 
            published_at = created_at,
            is_locked = true
        WHERE status = 'draft'
        """
    )

    # ── 3. Extend class_enrollments with refund tracking ─────────────────────
    # First, drop the old status column default
    op.alter_column("class_enrollments", "status", server_default=None)
    
    # Add new columns
    op.add_column(
        "class_enrollments",
        sa.Column("refund_amount", sa.Numeric(10, 2), nullable=True),
    )
    op.add_column(
        "class_enrollments",
        sa.Column("refund_processed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "class_enrollments",
        sa.Column("refund_provider_id", sa.String(128), nullable=True),
    )
    op.add_column(
        "class_enrollments",
        sa.Column("source", sa.String(16), nullable=False, server_default="manual"),
    )
    op.add_column(
        "class_enrollments",
        sa.Column(
            "client_user_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    
    # Add foreign key for client_user_id
    op.create_foreign_key(
        "fk_class_enrollments_client_user_id",
        "class_enrollments",
        "users",
        ["client_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_class_enrollments_client_user_id",
        "class_enrollments",
        ["client_user_id"],
    )
    
    # Update status column to new server default
    op.alter_column(
        "class_enrollments",
        "status",
        server_default="confirmed",
    )

    # ── 4. Create session_interest table ──────────────────────────────────────
    op.create_table(
        "session_interest",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column(
            "class_session_id",
            sa.BigInteger(),
            nullable=False,
        ),
        sa.Column(
            "client_user_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["class_session_id"],
            ["class_sessions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["client_user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("class_session_id", "client_user_id", name="uq_session_interest_user"),
    )
    op.create_index("ix_session_interest_class_session_id", "session_interest", ["class_session_id"])
    op.create_index("ix_session_interest_client_user_id", "session_interest", ["client_user_id"])

    # ── 5. Create expert_session_reliability table ────────────────────────────
    op.create_table(
        "expert_session_reliability",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column(
            "professional_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("total_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cancelled_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("late_cancellations", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("no_show_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reliability_score", sa.Numeric(5, 4), nullable=False, server_default="1.0000"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["professional_id"],
            ["professionals.user_id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index(
        "ix_expert_session_reliability_professional_id",
        "expert_session_reliability",
        ["professional_id"],
        unique=True,
    )

    # ── 6. Create tier_limits table ───────────────────────────────────────────
    op.create_table(
        "tier_limits",
        sa.Column("tier_name", sa.String(16), nullable=False),
        sa.Column("max_active_classes", sa.Integer(), nullable=False),
        sa.Column("max_sessions_per_month", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("tier_name"),
    )
    
    # Insert tier limits configuration
    op.execute(
        """
        INSERT INTO tier_limits (tier_name, max_active_classes, max_sessions_per_month) VALUES
        ('free', 2, 8),
        ('pro', 5, 20),
        ('elite', 15, 60),
        ('celeb', 999999, 999999)
        """
    )


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table("tier_limits")
    op.drop_index("ix_expert_session_reliability_professional_id", table_name="expert_session_reliability")
    op.drop_table("expert_session_reliability")
    op.drop_index("ix_session_interest_client_user_id", table_name="session_interest")
    op.drop_index("ix_session_interest_class_session_id", table_name="session_interest")
    op.drop_table("session_interest")
    
    # Remove class_enrollments extensions
    op.drop_index("ix_class_enrollments_client_user_id", table_name="class_enrollments")
    op.drop_constraint("fk_class_enrollments_client_user_id", "class_enrollments", type_="foreignkey")
    op.drop_column("class_enrollments", "client_user_id")
    op.drop_column("class_enrollments", "source")
    op.drop_column("class_enrollments", "refund_provider_id")
    op.drop_column("class_enrollments", "refund_processed_at")
    op.drop_column("class_enrollments", "refund_amount")
    
    # Remove class_sessions extensions
    op.drop_column("class_sessions", "cancelled_at")
    op.drop_column("class_sessions", "is_locked")
    op.drop_column("class_sessions", "published_at")
    op.drop_column("class_sessions", "status")
    
    # Remove group_classes extensions
    op.drop_column("group_classes", "expired_action_taken")
    op.drop_column("group_classes", "expires_on")
    op.drop_column("group_classes", "display_term")
