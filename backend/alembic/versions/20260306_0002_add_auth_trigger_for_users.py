"""add auth trigger for users

Revision ID: 20260306_0002
Revises: 20260305_0001
Create Date: 2026-03-06 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260306_0002"
down_revision: Union[str, None] = "20260305_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create a trigger function that inserts into public.users when auth.users is created
    op.execute("""
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.users (id, email, full_name)
      VALUES (
        new.id,
        new.email,
        COALESCE(
          new.raw_user_meta_data->>'name',
          new.raw_user_meta_data->>'full_name',
          (new.identities->>0)::jsonb->>'name',
          (new.identities->>0)::jsonb->>'full_name',
          ''
        )
      );
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
    """)

    # Drop existing trigger if it exists
    op.execute("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;")

    # Create the trigger that fires on INSERT to auth.users
    op.execute("""
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    """)


def downgrade() -> None:
    # Drop the trigger
    op.execute("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;")
    
    # Drop the trigger function
    op.execute("DROP FUNCTION IF EXISTS public.handle_new_user();")
