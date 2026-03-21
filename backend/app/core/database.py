import logging
import time

from sqlalchemy import event
from sqlalchemy import pool
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()
slow_sql_logger = logging.getLogger("app.slow_sql")


def _normalize_asyncpg_url(database_url: str) -> tuple[str, dict]:
    """Adapt common Postgres URL params (sslmode) for asyncpg compatibility."""
    parsed = make_url(database_url)
    query = dict(parsed.query)

    connect_args: dict = {"statement_cache_size": 0}
    sslmode = query.pop("sslmode", None)
    if sslmode:
        mode = str(sslmode).strip().lower()
        if mode == "disable":
            connect_args["ssl"] = False
        else:
            # asyncpg accepts ssl="require" for encrypted transport.
            connect_args["ssl"] = "require"

    normalized = parsed.set(query=query).render_as_string(hide_password=False)
    return normalized, connect_args


normalized_database_url, normalized_connect_args = _normalize_asyncpg_url(settings.DATABASE_URL)

engine = create_async_engine(
    normalized_database_url,
    echo=False,
    poolclass=pool.NullPool,
    # Supabase PgBouncer is incompatible with prepared statement caching.
    connect_args=normalized_connect_args,
)


if settings.SLOW_SQL_LOGGING_ENABLED:
    threshold_seconds = settings.SLOW_SQL_THRESHOLD_MS / 1000.0

    @event.listens_for(engine.sync_engine, "before_cursor_execute")
    def _before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        conn.info.setdefault("query_start_time", []).append(time.perf_counter())

    @event.listens_for(engine.sync_engine, "after_cursor_execute")
    def _after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        start_times = conn.info.get("query_start_time")
        if not start_times:
            return
        started_at = start_times.pop(-1)
        elapsed_seconds = time.perf_counter() - started_at
        if elapsed_seconds < threshold_seconds:
            return

        slow_sql_logger.warning(
            "Slow SQL detected (%.1f ms): %s",
            elapsed_seconds * 1000,
            " ".join(statement.split())[:1200],
        )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
