from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.models.issue import Issue
from app.schemas.issue_schema import IssueCreate, IssueResponse, IssueStatusUpdate
from app.deps import get_current_user, get_current_admin
from app.utils.image_upload import upload_image_to_supabase

router = APIRouter(prefix="/issues", tags=["issues"])

@router.post("", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    image_url = None
    if image:
        image_url = await upload_image_to_supabase(image)
        
    new_issue = Issue(
        title=title,
        description=description,
        category=category,
        latitude=latitude,
        longitude=longitude,
        image_url=image_url,
        created_by=current_user.id
    )
    
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    return new_issue

@router.get("", response_model=List[IssueResponse])
def get_issues(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Public route, anyone can view issues
    issues = db.query(Issue).offset(skip).limit(limit).all()
    return issues

@router.get("/{id}", response_model=IssueResponse)
def get_issue(id: UUID, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@router.put("/{id}/status", response_model=IssueResponse)
def update_issue_status(
    id: UUID, 
    status_update: IssueStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    issue.status = status_update.status
    db.commit()
    db.refresh(issue)
    return issue

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(
    id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    db.delete(issue)
    db.commit()
    return None
