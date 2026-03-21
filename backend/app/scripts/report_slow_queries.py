"""Print top slow SQL statements from pg_stat_statements.

Usage:
  python -m app.scripts.report_slow_queries --limit 20
"""

from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import text

from app.core.database import AsyncSessionLocal


QUERY = text(
    """
    SELECT
      calls,
      ROUND(total_exec_time::numeric, 2) AS total_exec_time_ms,
      ROUND(mean_exec_time::numeric, 2) AS mean_exec_time_ms,
      rows,
      LEFT(query, 400) AS query
    FROM pg_stat_statements
    WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
    ORDER BY total_exec_time DESC
    LIMIT :limit
    """
)


async def main(limit: int) -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(QUERY, {"limit": limit})
        rows = result.mappings().all()

    if not rows:
        print("No rows returned from pg_stat_statements. Ensure extension is enabled.")
        return

    for idx, row in enumerate(rows, start=1):
        print(
            f"{idx:02d}. calls={row['calls']} total_ms={row['total_exec_time_ms']} "
            f"mean_ms={row['mean_exec_time_ms']} rows={row['rows']}"
        )
        print(f"    {row['query']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Report top slow SQL queries")
    parser.add_argument("--limit", type=int, default=20)
    args = parser.parse_args()
    asyncio.run(main(limit=max(1, args.limit)))
