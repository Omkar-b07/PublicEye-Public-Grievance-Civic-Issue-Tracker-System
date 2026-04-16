from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.database import Base


def _uuid_str():
    return str(uuid.uuid4())


class Upvote(Base):
    """Tracks which users have upvoted which issues (prevents double-voting)."""
    __tablename__ = "upvotes"

    id = Column(String, primary_key=True, default=_uuid_str)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    issue_id = Column(String, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # A user can only upvote an issue once
    __table_args__ = (
        UniqueConstraint("user_id", "issue_id", name="uq_user_issue_upvote"),
    )

    user = relationship("User", back_populates="upvotes")
    issue = relationship("Issue", back_populates="upvote_records")
