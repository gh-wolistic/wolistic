"""Test coming_soon validation for subscription assignment"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import os

from app.models.professional import Professional


async def get_professional_id():
    """Get a professional ID from database"""
    engine = create_async_engine(os.getenv("DATABASE_URL"))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(select(Professional).limit(1))
        prof = result.scalar_one_or_none()
        if prof:
            print(f"Found professional: {prof.user_id}")
            return str(prof.user_id)
        else:
            print("No professionals found")
            return None


if __name__ == "__main__":
    prof_id = asyncio.run(get_professional_id())
    if prof_id:
        print(f"\nTo test coming_soon validation, run:")
        print(f"docker exec backend python -c \"")
        print(f"import requests, json;")
        print(f"payload = {{'professional_id': '{prof_id}', 'plan_id': 6, 'status': 'active'}};")
        print(f"r = requests.post('http://localhost:8000/api/v1/admin/subscriptions/assigned',")
        print(f"                  json=payload,")
        print(f"                  headers={{'X-Admin-Key': 'MochaMaple@26'}});")
        print(f"print('Status:', r.status_code);")
        print(f"print('Response:', r.json())\"")
