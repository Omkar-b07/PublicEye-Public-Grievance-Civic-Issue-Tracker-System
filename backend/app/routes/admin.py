from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.models.issue import Issue
from app.schemas.issue_schema import IssueResponse, IssueStatusUpdate, IssueAssignUpdate
from app.deps import get_current_user, get_current_admin
from app.utils.image_upload import upload_image_to_supabase

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/issues", response_model=List[IssueResponse])
def get_all_issues_admin(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    issues = db.query(Issue).offset(skip).limit(limit).all()
    return issues

@router.put("/status/{id}", response_model=IssueResponse)
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

@router.put("/assign/{id}", response_model=IssueResponse)
def assign_issue(
    id: UUID,
    assign_update: IssueAssignUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    issue.assigned_to = assign_update.assigned_to
    db.commit()
    db.refresh(issue)
    return issue
