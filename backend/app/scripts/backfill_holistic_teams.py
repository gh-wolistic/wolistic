from __future__ import annotations

import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.api.routes.holistic_teams import _generate_engine_team_if_needed


async def run_backfill(session: AsyncSession, queries: list[str], scope: str = "professionals") -> int:
    created = 0
    for query in queries:
        before = await session.execute(
            text(
                """
            SELECT id
            FROM holistic_teams
            WHERE source_type = 'engine_generated'
              AND scope = :scope
              AND query_tag = :query_tag
            LIMIT 1
            """
            ),
            {"scope": scope, "query_tag": query.strip().lower()},
        )
        existing = before.first()
        if existing is not None:
            continue
        await _generate_engine_team_if_needed(db=session, query=query, scope=scope)
        created += 1
    return created


async def main() -> None:
    cli_queries = [item.strip() for item in sys.argv[1:] if item.strip()]
    if not cli_queries:
        raise SystemExit("Provide one or more queries, e.g.: python -m app.scripts.backfill_holistic_teams diet stress")

    async with AsyncSessionLocal() as session:
        created = await run_backfill(session=session, queries=cli_queries)
        print(f"Holistic team backfill complete. Created: {created}")


if __name__ == "__main__":
    asyncio.run(main())
