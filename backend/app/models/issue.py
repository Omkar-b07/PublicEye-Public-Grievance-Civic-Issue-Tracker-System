from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Integer, Boolean
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.database import Base


def _uuid_str():
    """Generate a UUID as a string (compatible with SQLite)."""
    return str(uuid.uuid4())


class Issue(Base):
    __tablename__ = "issues"

    id = Column(String, primary_key=True, default=_uuid_str)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    address = Column(String, nullable=True)       # Human-readable address
    image_url = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Workflow status: PENDING → VERIFIED → IN_PROGRESS → RESOLVED  (or REJECTED)
    status = Column(String, default="PENDING", nullable=False)

    # Priority: HIGH, MEDIUM, LOW
    priority = Column(String, default="MEDIUM", nullable=False)

    # Admin verification flags
    is_verified = Column(Boolean, default=False, nullable=False)
    is_rejected = Column(Boolean, default=False, nullable=False)

    # Upvote count (denormalized for fast reads)
    upvotes = Column(Integer, default=0, nullable=False)

    # Feedback
    feedback_rating = Column(Integer, nullable=True)
    feedback_text = Column(Text, nullable=True)
    is_false_resolution = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    escalated_at = Column(DateTime, nullable=True)   # Set when escalated to senior authority

    # Relationships
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)

    creator = relationship("User", foreign_keys=[created_by], back_populates="reported_issues")
    assignee = relationship("User", foreign_keys=[assigned_to])
    upvote_records = relationship("Upvote", back_populates="issue", cascade="all, delete-orphan")
