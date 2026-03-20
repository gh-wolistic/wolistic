from __future__ import annotations

import argparse
import asyncio
import logging

from app.api.routes.professionals import _rebuild_featured_profiles_index
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal

logger = logging.getLogger("featured-index-refresh")


async def refresh_once() -> None:
    async with AsyncSessionLocal() as session:
        await _rebuild_featured_profiles_index(session)


async def run_refresh_worker(*, interval_seconds: int) -> None:
    logger.info("Starting featured index refresh worker (interval=%ss)", interval_seconds)
    while True:
        try:
            await refresh_once()
            logger.info("Featured index refresh completed")
        except Exception:
            logger.exception("Featured index refresh failed")
        await asyncio.sleep(interval_seconds)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Refresh professional featured index")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run a single refresh and exit",
    )
    parser.add_argument(
        "--interval-seconds",
        type=int,
        default=None,
        help="Worker loop interval in seconds (defaults to FEATURED_INDEX_REFRESH_SECONDS)",
    )
    return parser.parse_args()


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    args = parse_args()
    settings = get_settings()

    interval_seconds = args.interval_seconds or settings.FEATURED_INDEX_REFRESH_SECONDS
    if interval_seconds < 60:
        raise ValueError("FEATURED_INDEX_REFRESH_SECONDS must be >= 60")

    if args.once:
        await refresh_once()
        logger.info("Featured index refresh completed (once)")
        return

    await run_refresh_worker(interval_seconds=interval_seconds)


if __name__ == "__main__":
    asyncio.run(main())
