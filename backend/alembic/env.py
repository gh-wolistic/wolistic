from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import make_url

from app.core.config import get_settings
import app.models  # noqa: F401
from app.models.base import Base

config = context.config
settings = get_settings()

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _psycopg_url(database_url: str) -> str:
    """Convert the app DATABASE_URL to a psycopg3 sync URL for Alembic.

    psycopg3 (psycopg) doesn't use prepared statements by default, so it
    works cleanly with Supabase pgBouncer in transaction mode without any
    extra configuration.
    """
    parsed = make_url(database_url)
    query = dict(parsed.query)

    # asyncpg uses ssl= in connect_args; psycopg3 uses sslmode= in the URL (libpq native).
    ssl_val = query.pop("ssl", None)
    if ssl_val and "sslmode" not in query:
        mode_map = {"require": "require", "disable": "disable", "prefer": "prefer"}
        query["sslmode"] = mode_map.get(str(ssl_val).lower(), "require")

    normalized = parsed.set(drivername="postgresql+psycopg", query=query)
    return normalized.render_as_string(hide_password=False)


_db_url = _psycopg_url(settings.DATABASE_URL)
config.set_main_option("sqlalchemy.url", _db_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(_db_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
