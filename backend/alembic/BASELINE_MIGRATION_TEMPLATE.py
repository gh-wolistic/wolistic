"""v1.1 baseline migration template.

Copy this shape into the generated Alembic baseline revision and replace
placeholders with the real revision IDs and DDL.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "<new_revision_id>"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1) Extensions required by runtime
    # op.execute("CREATE EXTENSION IF NOT EXISTS ...")

    # 2) Core tables and constraints
    # op.create_table(...)

    # 3) Runtime SQL objects (functions/triggers) used by the application
    # op.execute("""CREATE OR REPLACE FUNCTION ...""")

    # 4) Indexes
    # op.create_index(...)

    # Keep this baseline schema-only where possible.
    pass


def downgrade() -> None:
    # Optional: define rollback operations in reverse order.
    # For one-way baselines, leave with explicit pass/comment.
    pass
