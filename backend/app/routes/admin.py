"""
Admin routes (role: admin):
  GET  /admin/issues                  — all issues with filters
  PUT  /admin/issues/{id}/verify      — verify (approve) an issue
  PUT  /admin/issues/{id}/reject      — reject an issue
  PUT  /admin/issues/{id}/assign      — assign issue to a user/dept
  PUT  /admin/issues/{id}/status      — update status directly
  GET  /admin/issues/{id}/duplicates  — find duplicate/similar issues
  DELETE /admin/issues/{id}           — hard delete
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.db.database import get_db
from app.models.user import User
from app.models.issue import Issue
from app.schemas.issue_schema import (
    IssueResponse, IssueStatusUpdate, IssueAssignUpdate,
    IssueMapPoint, DuplicateCheckResponse,
)
from app.schemas.user_schema import UserResponse
from app.deps import get_current_admin
from app.utils.duplicate_detection import find_similar_issues

router = APIRouter(prefix="/admin", tags=["admin"])


def _to_response(issue: Issue) -> dict:
    result = {c.name: getattr(issue, c.name) for c in issue.__table__.columns}
    result["creator"] = issue.creator
    result["assignee"] = issue.assignee
    result["user_has_upvoted"] = False
    return result


# ─────────────────────────────────────────────────────────────────────────────
# List All Issues (admin view — no filter restrictions)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/issues", response_model=List[IssueResponse])
def get_all_issues(
    skip: int = 0,
    limit: int = 200,
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    verified_only: bool = Query(False),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    q = db.query(Issue)

    if verified_only:
        q = q.filter(Issue.is_verified == True)
    if status:
        q = q.filter(Issue.status == status.upper())
    if category:
        q = q.filter(Issue.category == category)
    if priority:
        q = q.filter(Issue.priority == priority.upper())
    if search:
        pattern = f"%{search}%"
        q = q.filter(or_(Issue.title.ilike(pattern), Issue.description.ilike(pattern)))

    issues = q.order_by(Issue.created_at.desc()).offset(skip).limit(limit).all()
    return [_to_response(i) for i in issues]

# ─────────────────────────────────────────────────────────────────────────────
# List Departments
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/departments", response_model=List[UserResponse])
def get_departments(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Get a list of all department users to assign issues to."""
    return db.query(User).filter(User.role == "department").all()


# ─────────────────────────────────────────────────────────────────────────────
# Verify Issue
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/issues/{id}/verify", response_model=IssueResponse)
def verify_issue(
    id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Mark an issue as verified. Status advances to VERIFIED."""
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.is_verified = True
    issue.is_rejected = False
    issue.status = "VERIFIED"
    db.commit()
    db.refresh(issue)
    return _to_response(issue)


# ─────────────────────────────────────────────────────────────────────────────
# Reject Issue
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/issues/{id}/reject", response_model=IssueResponse)
def reject_issue(
    id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Mark an issue as rejected (fake/duplicate). Status becomes REJECTED."""
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.is_rejected = True
    issue.is_verified = False
    issue.status = "REJECTED"
    db.commit()
    db.refresh(issue)
    return _to_response(issue)


# ─────────────────────────────────────────────────────────────────────────────
# Assign Issue to a Department User
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/issues/{id}/assign", response_model=IssueResponse)
def assign_issue(
    id: str,
    assign_update: IssueAssignUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.assigned_to = assign_update.assigned_to
    issue.status = "IN_PROGRESS"
    db.commit()
    db.refresh(issue)
    return _to_response(issue)


# ─────────────────────────────────────────────────────────────────────────────
# Update Status (general)
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/issues/{id}/status", response_model=IssueResponse)
def update_status(
    id: str,
    status_update: IssueStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = status_update.status.upper()
    if issue.status == "RESOLVED":
        issue.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(issue)
    return _to_response(issue)


# ─────────────────────────────────────────────────────────────────────────────
# Duplicate Detection
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/issues/{id}/duplicates", response_model=DuplicateCheckResponse)
def check_duplicates(
    id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """
    Returns a list of potentially duplicate issues based on
    geographic proximity (< 500m) + text similarity (> 45%).
    """
    target = db.query(Issue).filter(Issue.id == id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Issue not found")

    all_issues = db.query(Issue).filter(Issue.id != id).all()
    duplicates = find_similar_issues(target, all_issues, exclude_id=id)

    return DuplicateCheckResponse(
        checked_issue_id=str(id),
        duplicates=duplicates,
        count=len(duplicates),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Delete (hard)
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/issues/{id}", status_code=204)
def delete_issue(
    id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    db.delete(issue)
    db.commit()
    return None
