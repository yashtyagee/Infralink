import os
from sqlalchemy import create_engine, Column, String, Float, DateTime, Integer, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid

# Read from environment, fallback to SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./entitynet.db")

# Only use check_same_thread for SQLite, PostgreSQL doesn't need it and will throw an error
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Render PostgreSQL URLs sometimes start with postgres:// instead of postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============ MODELS DEFINITIONS ============

class BusinessRecord(Base):
    __tablename__ = "business_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    address = Column(Text)
    phone = Column(String)
    pan = Column(String)
    gst = Column(String)
    source_department = Column(String)
    raw_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    ubid = Column(String, index=True)

class MatchLink(Base):
    __tablename__ = "match_links"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    record_1_id = Column(String, index=True)
    record_2_id = Column(String, index=True)
    similarity_score = Column(Float)
    decision = Column(String)  # AUTO_MERGE, PENDING_REVIEW, REJECTED
    decision_reason = Column(Text)
    matched_fields = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class UBIDProfile(Base):
    __tablename__ = "ubid_profiles"
    
    ubid = Column(String, primary_key=True)
    canonical_name = Column(String)
    anchor_type = Column(String)  # PAN, GST, etc.
    anchor_value = Column(String)
    status = Column(String)  # ACTIVE, DORMANT, CLOSED
    risk_score = Column(Float, default=0)
    source_departments = Column(JSON)
    record_ids = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Event(Base):
    __tablename__ = "events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ubid = Column(String, index=True)
    business_name = Column(String)
    department = Column(String)
    event_type = Column(String)
    event_date = Column(DateTime)
    description = Column(Text)
    raw_data = Column(JSON)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(String, index=True)
    action = Column(String)
    details = Column(JSON)
    actor = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create all tables
Base.metadata.create_all(bind=engine)