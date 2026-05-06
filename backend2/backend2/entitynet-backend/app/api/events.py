from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db, Event, UBIDProfile, BusinessRecord, AuditLog
from app.utils.csv_parser import parse_csv
import uuid
from datetime import datetime


router = APIRouter()


@router.post("/api/events/upload")
async def upload_events(file: UploadFile = File(...), db: Session = Depends(get_db)):
    events_data = await parse_csv(file)

    saved_events = []
    for event_data in events_data:
        event = Event(
            id=str(uuid.uuid4()),
            business_name=event_data.get('business_name', ''),
            department=event_data.get('department', ''),
            event_type=event_data.get('event_type', ''),
            event_date=datetime.fromisoformat(
                event_data.get('event_date', datetime.now().isoformat())
            ),
            description=event_data.get('description', ''),
            raw_data=event_data,
            ubid=None  # Will be matched later
        )
        db.add(event)
        saved_events.append(event)

    db.commit()
    return {"message": f"Uploaded {len(saved_events)} events"}


@router.get("/api/events/orphaned")
async def get_orphaned_events(db: Session = Depends(get_db)):
    """
    Return all events not yet linked to a UBID.
    Includes full details so the ReviewerPanel can show event_type, department, description.
    """
    orphans = db.query(Event).filter(Event.ubid.is_(None)).order_by(Event.event_date.desc()).all()

    return [{
        "id": e.id,
        "business_name": e.business_name,
        "source_department": e.department,      # frontend reads source_department
        "department": e.department,
        "event_type": e.event_type,
        "event_date": e.event_date.isoformat() if e.event_date else None,
        "description": e.description or f"{e.event_type} event from {e.department}",
        "join_failure_reason": "Best match was below threshold"
    } for e in orphans]


@router.post("/api/events/attach")
async def attach_event(request: dict, db: Session = Depends(get_db)):
    """
    Attach an orphaned event to a UBID.
    After attaching, updates the UBID profile's updated_at so analytics
    immediately reflects the change (compliance gap gets resolved).
    """
    event_id = request.get("event_id")
    ubid = request.get("ubid")

    if not event_id or not ubid:
        raise HTTPException(status_code=400, detail="event_id and ubid are required")

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Verify the UBID exists
    profile = db.query(UBIDProfile).filter(UBIDProfile.ubid == ubid).first()
    if not profile:
        raise HTTPException(status_code=404, detail=f"UBID {ubid} not found")

    # Attach event to UBID
    event.ubid = ubid
    if not event.event_date:
        event.event_date = datetime.utcnow()

    # Touch the profile so analytics picks up the change
    profile.updated_at = datetime.utcnow()

    # Recalculate risk: attaching an event reduces the "No Activity" risk
    existing_events = db.query(Event).filter(
        Event.ubid == ubid,
        Event.id != event_id
    ).count()

    if existing_events == 0 and profile.risk_score > 0:
        profile.risk_score = max(0.0, float(profile.risk_score) - 35.0)

    # Write audit log to the business profile so it appears in UBID profile timeline
    audit = AuditLog(
        entity_id=ubid,
        action="EVENT_ATTACHED",
        details={
            "event_id": event_id,
            "event_type": event.event_type,
            "department": event.department,
            "business_name": event.business_name,
            "event_date": event.event_date.isoformat() if event.event_date else None,
            "description": event.description,
            "message": f"Activity '{event.event_type}' from {event.department} manually attached to this profile"
        },
        actor="HUMAN_REVIEWER",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    # Count how many orphaned events remain
    remaining = db.query(Event).filter(Event.ubid.is_(None)).count()

    return {
        "message": f"Event '{event.event_type}' attached to UBID {ubid}",
        "ubid": ubid,
        "business_name": profile.canonical_name,
        "event_type": event.event_type,
        "remaining_orphans": remaining,
        "updated_risk_score": profile.risk_score
    }



@router.get("/api/events/{ubid}")
async def get_events_for_ubid(ubid: str, db: Session = Depends(get_db)):
    """Get all events for a specific UBID."""
    events = db.query(Event).filter(Event.ubid == ubid).order_by(Event.event_date.desc()).all()
    return [{
        "id": e.id,
        "business_name": e.business_name,
        "department": e.department,
        "event_type": e.event_type,
        "event_date": e.event_date.isoformat() if e.event_date else None,
        "description": e.description
    } for e in events]