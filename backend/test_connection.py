from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

try:
    with engine.connect() as conn:
        version = conn.execute(text("SELECT version();")).scalar()
        print("✅ Connected successfully!")
        print(version)
except Exception as e:
    print("❌ Connection failed:")
    print(e)