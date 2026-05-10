"""
Issues routes (public + authenticated):
  POST   /issues              — submit a new complaint (citizen)
  GET    /issues              — list issues (public, with filters)
  GET    /issues/map          — map-optimised lightweight list of verified issues
  GET    /issues/{id}         — get single issue detail
  POST   /issues/{id}/upvote  — toggle upvote (authenticated citizen)
  PUT    /issues/{id}/status  — update status (admin / department)
  DELETE /issues/{id}         — delete issue (admin only)
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.issue import Issue
from app.models.upvote import Upvote
from app.schemas.issue_schema import IssueResponse, IssueStatusUpdate, IssueMapPoint, UpvoteResponse, IssueFeedback
from app.deps import get_current_user, get_current_admin
from app.utils.image_upload import upload_image_locally

router = APIRouter(prefix="/issues", tags=["issues"])


def _attach_upvote_flag(issue: Issue, user: Optional[User], db: Session) -> dict:
    """Converts an Issue ORM object to dict and adds user_has_upvoted field."""
    result = {c.name: getattr(issue, c.name) for c in issue.__table__.columns}
    result["creator"] = issue.creator
    result["assignee"] = issue.assignee
    result["user_has_upvoted"] = False
    if user:
        voted = db.query(Upvote).filter(
            Upvote.user_id == user.id,
            Upvote.issue_id == issue.id
        ).first()
        result["user_has_upvoted"] = voted is not None
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Create Issue
# ─────────────────────────────────────────────────────────────────────────────
@router.post("", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: Optional[str] = Form(None),
    priority: Optional[str] = Form("MEDIUM"),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a new civic complaint. Image is optional."""
    image_url = None
    if image and image.filename:
        image_url = await upload_image_locally(image)

    # Validate priority
    allowed_priorities = {"HIGH", "MEDIUM", "LOW"}
    priority_upper = (priority or "MEDIUM").upper()
    if priority_upper not in allowed_priorities:
        priority_upper = "MEDIUM"

    new_issue = Issue(
        title=title,
        description=description,
        category=category,
        latitude=latitude,
        longitude=longitude,
        address=address,
        priority=priority_upper,
        image_url=image_url,
        created_by=current_user.id,
        status="PENDING",
    )
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    return _attach_upvote_flag(new_issue, current_user, db)


# ─────────────────────────────────────────────────────────────────────────────
# List Issues (citizen specific or all for non-citizens)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("", response_model=List[IssueResponse])
def get_issues(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    verified_only: bool = Query(False),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List issues.
    Citizens only see their own issues. Admin/Depts see all.
    """
    q = db.query(Issue)

    if current_user.role == "citizen":
        q = q.filter(Issue.created_by == current_user.id)

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
    return [_attach_upvote_flag(i, current_user, db) for i in issues]


# ─────────────────────────────────────────────────────────────────────────────
# Map Endpoint — lightweight, verified issues only
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/map", response_model=List[IssueMapPoint])
def get_map_issues(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns verified issues for map display. Citizens only see their own."""
    q = db.query(Issue)
    if current_user.role == "citizen":
        q = q.filter(Issue.created_by == current_user.id)
    else:
        q = q.filter(Issue.is_verified == True)
        
    return q.all()


# ─────────────────────────────────────────────────────────────────────────────
# Get Single Issue
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{id}", response_model=IssueResponse)
def get_issue(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    if current_user.role == "citizen" and issue.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this issue")
        
    return _attach_upvote_flag(issue, current_user, db)


# ─────────────────────────────────────────────────────────────────────────────
# Upvote Toggle
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/{id}/upvote", response_model=UpvoteResponse)
def toggle_upvote(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Toggle upvote for the current user on an issue.
    First call adds vote; second call removes it.
    """
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    existing = db.query(Upvote).filter(
        Upvote.user_id == current_user.id,
        Upvote.issue_id == id,
    ).first()

    if existing:
        # Remove upvote
        db.delete(existing)
        issue.upvotes = max(0, issue.upvotes - 1)
        user_has_upvoted = False
    else:
        # Add upvote
        upvote = Upvote(user_id=current_user.id, issue_id=id)
        db.add(upvote)
        issue.upvotes += 1
        user_has_upvoted = True

    db.commit()
    db.refresh(issue)

    return UpvoteResponse(
        issue_id=str(issue.id),
        upvotes=issue.upvotes,
        user_has_upvoted=user_has_upvoted,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Update Status (admin / department)
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/{id}/status", response_model=IssueResponse)
def update_issue_status(
    id: str,
    status_update: IssueStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = status_update.status.upper()
    db.commit()
    db.refresh(issue)
    return _attach_upvote_flag(issue, current_admin, db)


# ─────────────────────────────────────────────────────────────────────────────
# Delete Issue (admin only)
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(
    id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    db.delete(issue)
    db.commit()
    return None

# ─────────────────────────────────────────────────────────────────────────────
# Submit Feedback (for resolved issues)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/{id}/feedback", response_model=IssueResponse)
def submit_feedback(
    id: str,
    feedback: IssueFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    if issue.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the original creator can submit feedback.")
        
    if issue.status != "RESOLVED":
        raise HTTPException(status_code=400, detail="Feedback can only be submitted for resolved issues.")
        
    if issue.feedback_rating is not None:
        raise HTTPException(status_code=400, detail="Feedback has already been submitted for this issue.")
        
    issue.feedback_rating = feedback.rating
    issue.feedback_text = feedback.text
    db.commit()
    db.refresh(issue)
    
    return _attach_upvote_flag(issue, current_user, db)

# ─────────────────────────────────────────────────────────────────────────────
# Flag False Resolution (citizen)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/{id}/flag-false", response_model=IssueResponse)
def flag_false_resolution(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue = db.query(Issue).filter(Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    if issue.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the original creator can flag a false resolution.")

    if issue.status != "RESOLVED":
        raise HTTPException(status_code=400, detail="Only resolved issues can be flagged.")

    if issue.is_false_resolution:
        raise HTTPException(status_code=400, detail="This issue has already been flagged.")

    issue.is_false_resolution = True
    issue.escalated_at = datetime.utcnow()

    db.commit()
    db.refresh(issue)

    return _attach_upvote_flag(issue, current_user, db)
