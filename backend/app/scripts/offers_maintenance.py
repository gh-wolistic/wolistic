from __future__ import annotations

import argparse
import asyncio
import logging

from app.core.database import AsyncSessionLocal
from app.services.offers import run_auto_downgrade_job

logger = logging.getLogger("offers-maintenance")


async def run_once() -> dict:
    async with AsyncSessionLocal() as session:
        report = await run_auto_downgrade_job(session)
        await session.commit()
        return report


async def run_worker(interval_seconds: int) -> None:
    logger.info("Starting offers maintenance worker (interval=%ss)", interval_seconds)
    while True:
        try:
            report = await run_once()
            logger.info("Offers maintenance completed: %s", report)
        except Exception:
            logger.exception("Offers maintenance failed")
        await asyncio.sleep(interval_seconds)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run centralized offer maintenance jobs")
    parser.add_argument("--once", action="store_true", help="Run once and exit")
    parser.add_argument(
        "--interval-seconds",
        type=int,
        default=3600,
        help="Worker interval in seconds (default: 3600)",
    )
    return parser.parse_args()


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    args = parse_args()
    if args.once:
        report = await run_once()
        logger.info("Offers maintenance completed (once): %s", report)
        return

    if args.interval_seconds < 60:
        raise ValueError("interval-seconds must be >= 60")

    await run_worker(args.interval_seconds)


if __name__ == "__main__":
    asyncio.run(main())
