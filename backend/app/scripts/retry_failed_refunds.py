"""
Cron job: Retry failed refunds.

Run this daily (e.g., via crontab or scheduled task):
    0 3 * * * cd /app && python -m app.scripts.retry_failed_refunds

Logic:
- Find enrollments where refund was attempted but failed (refund_provider_id is NULL)
- Retry refund processing (up to 3 attempts total)
- Log results for manual intervention if still failing
"""

import asyncio
import logging
import sys
from datetime import datetime

from app.core.database import AsyncSessionLocal
from app.services.refund_service import retry_failed_refunds

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def main():
    """Run retry failed refunds job."""
    logger.info("=== Retry Failed Refunds Job Started ===")
    logger.info(f"Timestamp: {datetime.utcnow().isoformat()}")
    
    try:
        async with AsyncSessionLocal() as db:
            result = await retry_failed_refunds(db, max_retries=3)
            
            logger.info("=== Retry Failed Refunds Job Completed ===")
            logger.info(f"Refunds attempted: {result['attempted']}")
            logger.info(f"Successful: {result['successful']}")
            logger.info(f"Still failed: {result['still_failed']}")
            
            if result['still_failed'] > 0:
                logger.error(
                    f"⚠️  {result['still_failed']} refunds still failing after retry. "
                    f"Manual intervention required."
                )
            
            return 0
    
    except Exception as e:
        logger.error(f"Retry refunds job failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
