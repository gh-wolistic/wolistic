#!/usr/bin/env python3
"""Check audit logs count in database"""
import asyncio
from app.core.database import get_db_session
from sqlalchemy import text

async def main():
    async for db in get_db_session():
        result = await db.execute(text("SELECT COUNT(*) FROM admin_audit_logs"))
        count = result.scalar()
        print(f"Total audit logs: {count}")
        
        # Get last 5 logs if any exist
        if count > 0:
            result = await db.execute(
                text(
                    "SELECT id, action, resource_type, admin_email, created_at "
                    "FROM admin_audit_logs ORDER BY created_at DESC LIMIT 5"
                )
            )
            print("\nLast 5 logs:")
            for row in result:
                print(f"  {row.created_at} | {row.admin_email} | {row.action} | {row.resource_type}")
        break

if __name__ == "__main__":
    asyncio.run(main())
