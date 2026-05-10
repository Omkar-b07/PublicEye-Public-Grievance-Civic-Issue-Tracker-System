"""
Senior Authority / Escalation routes (role: senior_authority or admin):
  GET /escalation/issues           — issues that have been escalated (escalated_at is set)
  PUT /escalation/issues/{id}/intervene — admin/senior forcefully marks IN_PROGRESS → RESOLVED

Auto-escalation note:
  In production, use Celery/APScheduler to run _check_and_escalate_overdue() periodically.
  For this project we expose a manual endpoint that the admin can trigger.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.issue import Issue
from app.schemas.issue_schema import IssueResponse
from app.deps import get_current_senior_authority

router = APIRouter(prefix="/escalation", tags=["escalation"])

# Priority-based escalation limits (hours)
HIGH_PRIORITY_HOURS = 24
MEDIUM_PRIORITY_HOURS = 72
LOW_PRIORITY_HOURS = 120


def _to_response(issue: Issue) -> dict:
    result = {c.name: getattr(issue, c.name) for c in issue.__table__.columns}
    result["creator"] = issue.creator
    result["assignee"] = issue.assignee
    result["user_has_upvoted"] = False
    return result


@router.get("/issues", response_model=List[IssueResponse])
def get_escalated_issues(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_senior_authority),
):
    """Returns all issues that have been manually escalated (escalated_at is set)."""
    issues = (
        db.query(Issue)
        .filter(Issue.escalated_at.isnot(None))
        .filter(or_(Issue.status != "RESOLVED", Issue.is_false_resolution == True))
        .order_by(Issue.escalated_at.asc())
        .all()
    )
    return [_to_response(i) for i in issues]


@router.get("/overdue", response_model=List[IssueResponse])
def get_overdue_issues(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_senior_authority),
):
    """
    Returns IN_PROGRESS issues that have exceeded their priority-based time limits without resolution.
    These are time-based escalations (not manual).
    """
    now = datetime.utcnow()
    high_cutoff = now - timedelta(hours=HIGH_PRIORITY_HOURS)
    medium_cutoff = now - timedelta(hours=MEDIUM_PRIORITY_HOURS)
    low_cutoff = now - timedelta(hours=LOW_PRIORITY_HOURS)

    issues = (
        db.query(Issue)
        .filter(Issue.status == "IN_PROGRESS")
        .filter(Issue.resolved_at.is_(None))
        .filter(
            or_(
                and_(Issue.priority == "HIGH", Issue.created_at < high_cutoff),
                and_(Issue.priority == "MEDIUM", Issue.created_at < medium_cutoff),
                and_(Issue.priority == "LOW", Issue.created_at < low_cutoff),
            )
        )
        .order_by(Issue.created_at.asc())
        .all()
    )
    return [_to_response(i) for i in issues]


@router.put("/issues/{id}/intervene", response_model=IssueResponse)
def intervene_issue(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_senior_authority),
):
    """
    Senior authority / admin force-resolves an escalated issue.
    Sets status to RESOLVED and records resolved_at.
    """
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = "RESOLVED"
    issue.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(issue)
    return _to_response(issue)


@router.post("/auto-escalate", status_code=200)
def auto_escalate_overdue(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_senior_authority),
):
    """
    Manually trigger auto-escalation logic:
    Marks all IN_PROGRESS issues older than their priority time limit as escalated.
    In production, this would be called by a background scheduler.
    """
    now = datetime.utcnow()
    high_cutoff = now - timedelta(hours=HIGH_PRIORITY_HOURS)
    medium_cutoff = now - timedelta(hours=MEDIUM_PRIORITY_HOURS)
    low_cutoff = now - timedelta(hours=LOW_PRIORITY_HOURS)

    overdue = (
        db.query(Issue)
        .filter(Issue.status == "IN_PROGRESS")
        .filter(Issue.escalated_at.is_(None))
        .filter(
            or_(
                and_(Issue.priority == "HIGH", Issue.created_at < high_cutoff),
                and_(Issue.priority == "MEDIUM", Issue.created_at < medium_cutoff),
                and_(Issue.priority == "LOW", Issue.created_at < low_cutoff),
            )
        )
        .all()
    )

    count = 0
    for issue in overdue:
        issue.escalated_at = datetime.utcnow()
        count += 1

    db.commit()
    return {"message": f"Auto-escalated {count} overdue issues."}
