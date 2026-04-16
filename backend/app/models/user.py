from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.database import Base


def _uuid_str():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid_str)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    # Roles: 'citizen', 'admin', 'department', 'senior_authority'
    role = Column(String, default="citizen", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    reported_issues = relationship("Issue", foreign_keys="Issue.created_by", back_populates="creator")
    upvotes = relationship("Upvote", back_populates="user")
