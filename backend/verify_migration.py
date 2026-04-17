"""Quick migration verification script."""
import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as db:
        # Check tables exist
        print("Checking tables...")
        result = await db.execute(
            text(
                """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema='public' 
                AND table_name IN (
                    'session_interest', 
                    'expert_session_reliability', 
                    'tier_limits',
                    'class_sessions',
                    'group_classes'
                )
                ORDER BY table_name
                """
            )
        )
        tables = [r[0] for r in result]
        print(f"✅ Tables found: {', '.join(tables)}\n")
        
        # Check tier limits data
        print("Checking tier limits configuration...")
        result = await db.execute(
            text("SELECT tier_name, max_active_classes, max_sessions_per_month FROM tier_limits ORDER BY tier_name")
        )
        for row in result:
            print(f"  {row[0]:8} -> {row[1]:2} classes, {row[2]:3} sessions/month")
        
        # Check new columns on class_sessions
        print("\nChecking class_sessions columns...")
        result = await db.execute(
            text(
                """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='class_sessions' 
                AND column_name IN ('status', 'published_at', 'is_locked', 'cancelled_at')
                ORDER BY column_name
                """
            )
        )
        columns = [r[0] for r in result]
        print(f"  New columns: {', '.join(columns)}")
        
        # Check new columns on group_classes
        print("\nChecking group_classes columns...")
        result = await db.execute(
            text(
                """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='group_classes' 
                AND column_name IN ('display_term', 'expires_on', 'expired_action_taken')
                ORDER BY column_name
                """
            )
        )
        columns = [r[0] for r in result]
        print(f"  New columns: {', '.join(columns)}")
        
        print("\n✅ Migration verification complete!")


if __name__ == "__main__":
    asyncio.run(main())
