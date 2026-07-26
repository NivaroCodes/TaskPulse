import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.subscription import OrganizationSubscription

async def make_everyone_enterprise():
    async with SessionLocal() as db:
        result = await db.execute(select(OrganizationSubscription))
        subs = result.scalars().all()
        print(f'Found {len(subs)} existing subscriptions.')
        
        if not subs:
            print("No subscriptions found in DB! We will need your Org ID to manually create an Enterprise record.")
        
        for sub in subs:
            sub.plan = 'enterprise'
            print(f'Updated org {sub.org_id} to enterprise plan.')
            
        await db.commit()
        print('Successfully granted Enterprise!')

if __name__ == "__main__":
    asyncio.run(make_everyone_enterprise())
