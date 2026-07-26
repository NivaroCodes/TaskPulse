import uuid
from datetime import datetime, UTC
from sqlalchemy import Column, String, DateTime
from app.core.database import Base

class OrganizationSubscription(Base):
    __tablename__ = "organization_subscriptions"

    org_id = Column(String, primary_key=True, index=True)
    plan = Column(String, default="free", nullable=False)
    stripe_customer_id = Column(String, nullable=True, index=True)
    stripe_subscription_id = Column(String, nullable=True, index=True)
    kaspi_order_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)
