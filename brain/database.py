import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import text
from datetime import datetime, timedelta

DATABASE_URL = "sqlite:///./memory.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True)
    phone_number = Column(String, nullable=False)  # e.g. 233XXXXXXXXX
    relationship = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ConversationMessage(Base):
    __tablename__ = "conversation_messages"
    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String, index=True)  # WhatsApp ID of the conversation
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class HumanTakeover(Base):
    """Tracks which conversations Solomon has manually taken over.
    Persisted to DB so it survives Python Brain restarts."""
    __tablename__ = "human_takeovers"
    id = Column(Integer, primary_key=True, index=True)
    chat_jid = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)

def init_db():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE contacts ADD COLUMN relationship VARCHAR"))
        except Exception:
            pass
        conn.execute(text("PRAGMA journal_mode=WAL;"))

def set_human_takeover(chat_jid: str, minutes: int = 30):
    """Mark a conversation as human-controlled for the given duration.
    If an entry already exists, it is refreshed (extended)."""
    db = SessionLocal()
    expires_at = datetime.utcnow() + timedelta(minutes=minutes)
    existing = db.query(HumanTakeover).filter(HumanTakeover.chat_jid == chat_jid).first()
    if existing:
        existing.expires_at = expires_at
    else:
        db.add(HumanTakeover(chat_jid=chat_jid, expires_at=expires_at))
    db.commit()
    db.close()

def is_human_takeover_active(chat_jid: str) -> bool:
    """Returns True if Solomon has manually taken over this conversation and the timer hasn't expired."""
    db = SessionLocal()
    record = db.query(HumanTakeover).filter(HumanTakeover.chat_jid == chat_jid).first()
    if not record:
        db.close()
        return False
    if datetime.utcnow() < record.expires_at:
        db.close()
        return True
    # Timer expired — clean up the record
    db.delete(record)
    db.commit()
    db.close()
    return False

def save_conversation_message(sender: str, role: str, content: str):
    db = SessionLocal()
    msg = ConversationMessage(sender=sender, role=role, content=content)
    db.add(msg)
    db.commit()
    db.close()

def get_recent_messages(sender: str, limit: int = 20):
    db = SessionLocal()
    messages = db.query(ConversationMessage).filter(ConversationMessage.sender == sender).order_by(ConversationMessage.created_at.desc()).limit(limit).all()
    db.close()
    return messages[::-1]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
