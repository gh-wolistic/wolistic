"""
Cron job: Auto-refund enrollments for sessions where expert didn't mark attendance.

Run this daily (e.g., via crontab or scheduled task):
    0 2 * * * cd /app && python -m app.scripts.auto_refund_no_show_sessions

Logic:
- Find published sessions where session_date + 48h < now
- Find enrollments still in "confirmed" status (not marked as attended/no-show)
- Process refund for all such enrollments
- Update expert reliability score
- Send email notifications
"""

import asyncio
import logging
import sys
from datetime import datetime

from app.core.database import AsyncSessionLocal
from app.services.refund_service import process_auto_refunds_for_no_show_sessions

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def main():
    """Run auto-refund job."""
    logger.info("=== Auto-Refund Job Started ===")
    logger.info(f"Timestamp: {datetime.utcnow().isoformat()}")
    
    try:
        async with AsyncSessionLocal() as db:
            result = await process_auto_refunds_for_no_show_sessions(db)
            
            logger.info("=== Auto-Refund Job Completed ===")
            logger.info(f"Sessions processed: {result['sessions_processed']}")
            logger.info(f"Enrollments refunded: {result['enrollments_refunded']}")
            logger.info(f"Total amount refunded: ₹{result['total_amount_refunded']:.2f}")
            
            if result['enrollments_refunded'] > 0:
                logger.warning(
                    f"⚠️  {result['sessions_processed']} experts failed to mark attendance. "
                    f"Reliability scores will be impacted."
                )
            
            return 0
    
    except Exception as e:
        logger.error(f"Auto-refund job failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
