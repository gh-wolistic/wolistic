"""add_session_mode_to_group_classes

Revision ID: a7b8c9d0e1f2
Revises: e1e23729c84e
Create Date: 2026-04-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = 'e1e23729c84e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add session_mode column to group_classes table
    # online = video/virtual sessions
    # in_person = physical location required  
    # hybrid = both options available
    op.add_column('group_classes', sa.Column('session_mode', sa.String(length=16), server_default='in_person', nullable=False))


def downgrade() -> None:
    # Remove session_mode column
    op.drop_column('group_classes', 'session_mode')
