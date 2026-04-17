"""Check user's class status."""
import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def check_user_classes():
    async with AsyncSessionLocal() as db:
        # Get the user's classes with their status
        result = await db.execute(text("""
            SELECT 
                gc.id,
                gc.title,
                gc.status,
                gc.expires_on,
                CASE WHEN gc.expires_on > CURRENT_DATE THEN 'valid' ELSE 'expired' END as expiry_status
            FROM group_classes gc
            JOIN professionals p ON gc.professional_id = p.user_id
            JOIN professional_subscriptions ps ON ps.professional_id = p.user_id
            JOIN subscription_plans sp ON ps.plan_id = sp.id
            WHERE ps.status = 'active'
            ORDER BY gc.created_at DESC
        """))
        rows = result.fetchall()
        
        print("\nUser's Classes:")
        print("-" * 100)
        print(f"{'ID':<6} | {'Title':<30} | {'Status':<10} | {'Expires On':<12} | {'Expiry Status':<15}")
        print("-" * 100)
        
        active_count = 0
        for row in rows:
            print(f"{row.id:<6} | {row.title:<30} | {row.status:<10} | {str(row.expires_on):<12} | {row.expiry_status:<15}")
            if row.status == 'active' and row.expiry_status == 'valid':
                active_count += 1
        
        print("-" * 100)
        print(f"\nActive classes (status='active' AND expires_on > today): {active_count}")
        
        # Get user's subscription tier
        tier_result = await db.execute(text("""
            SELECT sp.tier, sp.name
            FROM professional_subscriptions ps
            JOIN subscription_plans sp ON ps.plan_id = sp.id
            WHERE ps.status = 'active'
            LIMIT 1
        """))
        tier_row = tier_result.fetchone()
        
        if tier_row:
            print(f"User's tier: {tier_row.name} ({tier_row.tier})")
            
            # Get tier limit
            limit_result = await db.execute(text(f"""
                SELECT max_active_classes FROM tier_limits WHERE tier_name = '{tier_row.tier}'
            """))
            limit_row = limit_result.fetchone()
            if limit_row:
                print(f"Tier limit: {limit_row.max_active_classes}")
                print(f"\n{'✅ WITHIN LIMIT' if active_count <= limit_row.max_active_classes else '❌ EXCEEDS LIMIT'}")

if __name__ == "__main__":
    asyncio.run(check_user_classes())
