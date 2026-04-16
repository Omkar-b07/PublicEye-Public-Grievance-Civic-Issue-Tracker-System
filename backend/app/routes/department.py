"""
Department routes (role: department or admin):
  GET /department/issues           — issues assigned to dept (IN_PROGRESS)
  PUT /department/issues/{id}/resolve   — mark issue RESOLVED
  PUT /department/issues/{id}/escalate  — escalate to senior authority
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.issue import Issue
from app.schemas.issue_schema import IssueResponse
from app.deps import get_current_department

router = APIRouter(prefix="/department", tags=["department"])


def _to_response(issue: Issue) -> dict:
    result = {c.name: getattr(issue, c.name) for c in issue.__table__.columns}
    result["creator"] = issue.creator
    result["assignee"] = issue.assignee
    result["user_has_upvoted"] = False
    return result


@router.get("/issues", response_model=List[IssueResponse])
def get_department_issues(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_department),
):
    """
    Returns all issues currently IN_PROGRESS (i.e., verified + assigned to a department).
    Department users can only see issues assigned to them.
    Admins see all IN_PROGRESS issues.
    """
    q = db.query(Issue).filter(Issue.status == "IN_PROGRESS")

    if current_user.role == "department":
        q = q.filter(Issue.assigned_to == current_user.id)

    issues = q.order_by(Issue.created_at.asc()).all()
    return [_to_response(i) for i in issues]


@router.put("/issues/{id}/resolve", response_model=IssueResponse)
def resolve_issue(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_department),
):
    """Mark an issue as RESOLVED. Records the resolved_at timestamp."""
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    # Department users can only resolve their assigned issues
    if current_user.role == "department" and issue.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You can only resolve issues assigned to you.")

    issue.status = "RESOLVED"
    issue.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(issue)
    return _to_response(issue)


@router.put("/issues/{id}/escalate", response_model=IssueResponse)
def escalate_issue(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_department),
):
    """
    Escalate an issue to senior authority by setting escalated_at.
    The issue remains IN_PROGRESS but is now surfaced in the senior authority view.
    """
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    if current_user.role == "department" and issue.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You can only escalate issues assigned to you.")

    issue.escalated_at = datetime.utcnow()
    db.commit()
    db.refresh(issue)
    return _to_response(issue)
