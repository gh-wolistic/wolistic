"""Create enrollment_payments table directly via SQL."""
import sys
sys.path.insert(0, '/app')

import asyncio
from sqlalchemy import text
from app.core.database import engine

async def create_table():
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS enrollment_payments (
                id BIGSERIAL PRIMARY KEY,
                enrollment_id BIGINT NOT NULL REFERENCES class_enrollments(id) ON DELETE CASCADE,
                provider VARCHAR(32) NOT NULL,
                provider_order_id VARCHAR(128) UNIQUE NOT NULL,
                provider_payment_id VARCHAR(128) UNIQUE,
                provider_signature VARCHAR(512),
                provider_payload JSONB,
                amount NUMERIC(10,2) NOT NULL,
                currency VARCHAR(8) NOT NULL DEFAULT 'INR',
                status VARCHAR(32) NOT NULL DEFAULT 'created',
                verified_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """))
        
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_enrollment_payments_enrollment_id 
            ON enrollment_payments(enrollment_id);
        """))
        
        await conn.execute(text("""
            INSERT INTO alembic_version (version_num) 
            VALUES ('256754fbfd1e') 
            ON CONFLICT DO NOTHING;
        """))
        
        print("✅ enrollment_payments table created successfully")

if __name__ == "__main__":
    asyncio.run(create_table())
