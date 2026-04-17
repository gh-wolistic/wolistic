"""Check when user's classes were created."""
import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def check_class_creation_times():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("""
            SELECT 
                gc.id,
                gc.title,
                gc.status,
                gc.created_at
            FROM group_classes gc
            JOIN professionals p ON gc.professional_id = p.user_id
            JOIN professional_subscriptions ps ON ps.professional_id = p.user_id
            WHERE ps.status = 'active'
            ORDER BY gc.created_at ASC
        """))
        rows = result.fetchall()
        
        print("\nClass Creation Timeline:")
        print("-" * 80)
        print(f"{'ID':<6} | {'Title':<30} | {'Status':<10} | {'Created At':<25}")
        print("-" * 80)
        
        for row in rows:
            print(f"{row.id:<6} | {row.title:<30} | {row.status:<10} | {str(row.created_at):<25}")
        
        print("-" * 80)
        print("\nTier Enforcement Added: 2026-04-16 11:29:23")
        print("If classes were created BEFORE this time, they bypassed enforcement.")

if __name__ == "__main__":
    asyncio.run(check_class_creation_times())
