from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schemas.user_schema import UserResponse


class IssueCreate(BaseModel):
    title: str
    description: str
    category: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    image_url: Optional[str] = None


class IssueResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    address: Optional[str] = None
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    status: str
    priority: str
    is_verified: bool
    is_rejected: bool
    upvotes: int
    created_at: datetime
    resolved_at: Optional[datetime] = None
    escalated_at: Optional[datetime] = None
    created_by: str
    assigned_to: Optional[str] = None

    creator: Optional[UserResponse] = None
    assignee: Optional[UserResponse] = None

    feedback_rating: Optional[int] = None
    feedback_text: Optional[str] = None
    is_false_resolution: bool

    # Set by the API endpoint based on current user's upvote state
    user_has_upvoted: Optional[bool] = False

    class Config:
        from_attributes = True


class IssueStatusUpdate(BaseModel):
    status: str  # PENDING, VERIFIED, IN_PROGRESS, RESOLVED, REJECTED


class IssueAssignUpdate(BaseModel):
    assigned_to: str


class IssueFeedback(BaseModel):
    rating: int  # 1 to 5
    text: Optional[str] = None


class IssueVerifyUpdate(BaseModel):
    """Used by admin to verify or reject an issue."""
    verified: bool  # True = verify, False = reject
    note: Optional[str] = None


class IssueMapPoint(BaseModel):
    """Lightweight schema for map display — avoids sending full issue data."""
    id: str
    title: str
    category: str
    status: str
    priority: str
    upvotes: int
    latitude: float
    longitude: float
    address: Optional[str] = None

    class Config:
        from_attributes = True


class UpvoteResponse(BaseModel):
    issue_id: str
    upvotes: int
    user_has_upvoted: bool


class DuplicateCheckResponse(BaseModel):
    checked_issue_id: str
    duplicates: list[IssueMapPoint]
    count: int
