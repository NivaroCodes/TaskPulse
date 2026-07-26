import asyncio
from app.core.clerk import clerk
import traceback

async def main():
    try:
        user_id = "user_2FLM8kIpzOCdKJohQvbfB2nf8OJ"
        print(hasattr(clerk.users, 'organization_membership_list'))
        print(hasattr(clerk.users, 'list_organization_memberships'))
        print(hasattr(clerk.users, 'get_organization_memberships'))
    except Exception as e:
        print(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(main())
