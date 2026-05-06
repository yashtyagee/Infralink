from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db, MatchLink, UBIDProfile
from datetime import datetime
import uuid

router = APIRouter()

# In-memory store for notifications (persisted per server session)
# In production, this would be a DB table.
_notifications = []


def _ensure_seeded(db: Session):
    """Auto-generate notifications from real system state."""
    global _notifications
    # Only seed if empty
    if _notifications:
        return

    # Pull pending review items
    pending = db.query(MatchLink).filter(MatchLink.decision == "PENDING_REVIEW").count()
    if pending > 0:
        _notifications.append({
            "id": str(uuid.uuid4()),
            "type": "PENDING_REVIEW",
            "message": f"{pending} entity pair(s) are awaiting human review for merge decision.",
            "severity": "warning",
            "is_read": False,
            "created_at": datetime.utcnow().isoformat()
        })

    # Warn about UNKNOWN-status profiles
    unknown = db.query(UBIDProfile).filter(UBIDProfile.status == "UNKNOWN").count()
    if unknown > 0:
        _notifications.append({
            "id": str(uuid.uuid4()),
            "type": "UNRESOLVED_PROFILES",
            "message": f"{unknown} UBID profile(s) have UNKNOWN status and may need attention.",
            "severity": "warning",
            "is_read": False,
            "created_at": datetime.utcnow().isoformat()
        })

    total = db.query(UBIDProfile).count()
    _notifications.append({
        "id": str(uuid.uuid4()),
        "type": "SYSTEM",
        "message": f"EntityNet is running. {total} UBID profile(s) currently in the registry.",
        "severity": "info",
        "is_read": False,
        "created_at": datetime.utcnow().isoformat()
    })


@router.get("/api/notifications")
async def get_notifications(db: Session = Depends(get_db)):
    _ensure_seeded(db)
    return _notifications


@router.get("/api/notifications/unread-count")
async def get_unread_count(db: Session = Depends(get_db)):
    _ensure_seeded(db)
    count = sum(1 for n in _notifications if not n["is_read"])
    return {"count": count}


@router.post("/api/notifications/{notification_id}/read")
async def mark_as_read(notification_id: str):
    for n in _notifications:
        if n["id"] == notification_id:
            n["is_read"] = True
            return {"success": True}
    raise HTTPException(status_code=404, detail="Notification not found")


@router.post("/api/notifications/read-all")
async def mark_all_read():
    for n in _notifications:
        n["is_read"] = True
    return {"success": True}


def push_notification(type_: str, message: str, severity: str = "info"):
    """Call this from other services to push a real-time notification."""
    _notifications.insert(0, {
        "id": str(uuid.uuid4()),
        "type": type_,
        "message": message,
        "severity": severity,
        "is_read": False,
        "created_at": datetime.utcnow().isoformat()
    })
