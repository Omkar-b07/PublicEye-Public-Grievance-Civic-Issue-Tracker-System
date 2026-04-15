from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.schemas.user_schema import UserResponse

class IssueCreate(BaseModel):
    title: str
    description: str
    category: str
    latitude: float
    longitude: float
    image_url: Optional[str] = None

class IssueResponse(BaseModel):
    id: UUID
    title: str
    description: str
    category: str
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    status: str
    created_at: datetime
    created_by: UUID
    assigned_to: Optional[UUID] = None
    
    creator: Optional[UserResponse] = None
    assignee: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class IssueStatusUpdate(BaseModel):
    status: str # OPEN, IN_PROGRESS, RESOLVED

class IssueAssignUpdate(BaseModel):
    assigned_to: UUID
