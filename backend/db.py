from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
from sqlalchemy.sql import func

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/hcp_crm_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class InteractionDB(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_name = Column(String(100), index=True)
    interaction_type = Column(String(50))
    notes = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())