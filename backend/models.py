from database import Base
from sqlalchemy import Column, Integer, String, Boolean, float

class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(float)
    category = Column(String)
    description = Column(String)
    is_income = Column(Boolean)
    date = Column(String)