"""Check professionals in database"""
import asyncio
from app.core.database import get_db_session
from app.models.user import User
from app.models.professional import Professional
from sqlalchemy import select, func


async def check():
    async for db in get_db_session():
        # Count total partners
        count_result = await db.execute(
            select(func.count()).select_from(User).where(User.user_type == "partner")
        )
        total_partners = count_result.scalar_one()
        print(f"\n=== Total partners: {total_partners} ===\n")
        
        # Get all partners with their professional data
        result = await db.execute(
            select(User.id, User.email, User.user_type, User.user_status, Professional.membership_tier)
            .outerjoin(Professional, Professional.user_id == User.id)
            .where(User.user_type == "partner")
            .limit(20)
        )
        rows = result.all()
        
        print(f"Partner details:")
        for row in rows:
            user_id, email, user_type, user_status, tier = row
            tier_display = tier or "NULL (should be 'free')"
            print(f"  {email[:30]:30} | status={user_status or 'pending'} | tier={tier_display}")
        
        # Count by tier (treating NULL as free)
        tier_result = await db.execute(
            select(func.coalesce(Professional.membership_tier, "free").label("tier"), func.count())
            .select_from(User)
            .outerjoin(Professional, Professional.user_id == User.id)
            .where(User.user_type == "partner")
            .group_by("tier")
        )
        tier_counts = tier_result.all()
        
        print(f"\nTier distribution:")
        for tier, count in tier_counts:
            print(f"  {tier}: {count}")
        
        break


if __name__ == "__main__":
    asyncio.run(check())
