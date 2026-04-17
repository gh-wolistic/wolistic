"""Check tier_limits table data."""
import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def check_limits():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT * FROM tier_limits ORDER BY tier_name"))
        rows = result.fetchall()
        
        print("\nTier Limits in Database:")
        print("-" * 70)
        print(f"{'Tier':<10} | {'Max Active Classes':<20} | {'Max Sessions/Month':<20}")
        print("-" * 70)
        
        for row in rows:
            print(f"{row.tier_name:<10} | {row.max_active_classes:<20} | {row.max_sessions_per_month:<20}")
        
        if not rows:
            print("❌ NO DATA FOUND - Migration may not have run!")

if __name__ == "__main__":
    asyncio.run(check_limits())
