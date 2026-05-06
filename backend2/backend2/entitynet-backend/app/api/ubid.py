from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.database import get_db, UBIDProfile, BusinessRecord, Event
from typing import Optional

router = APIRouter()

@router.get("/api/ubid")
async def get_all_ubids(db: Session = Depends(get_db)):
    """Fetches all clustered business profiles."""
    profiles = db.query(UBIDProfile).all()
    
    return [{
        "ubid": p.ubid,
        "canonical_name": p.canonical_name,
        "status": p.status,
        "anchor_type": p.anchor_type,
        "anchor_value": p.anchor_value,
        "source_departments": ", ".join([d for d in p.source_departments if d]) if p.source_departments else "",
        "record_count": len(p.record_ids) if p.record_ids else 0,
        "risk_score": p.risk_score
    } for p in profiles]

@router.get("/api/ubid/{ubid}/sources")
async def get_ubid_sources(ubid: str, db: Session = Depends(get_db)):
    """Returns the raw department records inside a specific cluster."""
    records = db.query(BusinessRecord).filter(BusinessRecord.ubid == ubid).all()
    
    if not records:
        raise HTTPException(status_code=404, detail="UBID not found")
    
    # Get anchor info
    profile = db.query(UBIDProfile).filter(UBIDProfile.ubid == ubid).first()
    
    return {
        "meta": {
            "ubid": ubid,
            "anchor_type": profile.anchor_type if profile else "UNKNOWN",
            "anchor_value": profile.anchor_value if profile else "UNKNOWN",
            "record_count": len(records)
        },
        "records": [{
            "id": r.id,
            "name": r.name,
            "address": r.address,
            "phone": r.phone,
            "pan": r.pan,
            "gst": r.gst,
            "source_department": r.source_department,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in records]
    }

@router.get("/api/ubid/{ubid}/events")
async def get_ubid_events(ubid: str, db: Session = Depends(get_db)):
    """Get all events/activities for a specific UBID."""
    events = db.query(Event).filter(Event.ubid == ubid).order_by(Event.event_date.desc()).all()
    
    return [{
        "id": e.id,
        "department": e.department,
        "event_type": e.event_type,
        "event_date": e.event_date.isoformat() if e.event_date else None,
        "description": e.description
    } for e in events]

# ============ NEW LOOKUP ENDPOINTS ============

@router.get("/api/lookup")
async def lookup_ubid(
    pan: Optional[str] = Query(None, description="PAN number (10 characters)"),
    gst: Optional[str] = Query(None, description="GST number (15 characters)"),
    name: Optional[str] = Query(None, description="Business name"),
    db: Session = Depends(get_db)
):
    """
    Lookup UBID by PAN, GST, or Business Name.
    
    Examples:
    - /api/lookup?pan=ABCDE1234F
    - /api/lookup?gst=29AAAAA0000A1Z
    - /api/lookup?name=ABC%20Technologies
    """
    if not pan and not gst and not name:
        raise HTTPException(
            status_code=400, 
            detail="At least one query parameter is required: pan, gst, or name"
        )
    
    result = {"found": False, "matches": []}
    
    # Case 1: Lookup by PAN (highest priority)
    if pan:
        pan_upper = pan.upper().strip()
        
        # Search in UBIDProfile anchor
        profile = db.query(UBIDProfile).filter(
            UBIDProfile.anchor_type == "PAN", 
            UBIDProfile.anchor_value == pan_upper
        ).first()
        
        if profile:
            return {
                "found": True,
                "identification_method": "PAN",
                "ubid": profile.ubid,
                "canonical_name": profile.canonical_name,
                "status": profile.status,
                "risk_score": profile.risk_score,
                "anchor_type": profile.anchor_type,
                "anchor_value": profile.anchor_value,
                "source_departments": profile.source_departments,
                "record_count": len(profile.record_ids) if profile.record_ids else 0
            }
        
        # Search in BusinessRecord (if not in profile)
        record = db.query(BusinessRecord).filter(BusinessRecord.pan == pan_upper).first()
        if record and record.ubid:
            profile = db.query(UBIDProfile).filter(UBIDProfile.ubid == record.ubid).first()
            if profile:
                return {
                    "found": True,
                    "identification_method": "PAN (via record)",
                    "ubid": profile.ubid,
                    "canonical_name": profile.canonical_name,
                    "status": profile.status,
                    "risk_score": profile.risk_score,
                    "anchor_type": profile.anchor_type,
                    "anchor_value": profile.anchor_value,
                    "source_departments": profile.source_departments,
                    "record_count": len(profile.record_ids) if profile.record_ids else 0
                }
    
    # Case 2: Lookup by GST
    if gst:
        gst_upper = gst.upper().strip()
        
        profile = db.query(UBIDProfile).filter(
            UBIDProfile.anchor_type == "GST", 
            UBIDProfile.anchor_value == gst_upper
        ).first()
        
        if profile:
            return {
                "found": True,
                "identification_method": "GST",
                "ubid": profile.ubid,
                "canonical_name": profile.canonical_name,
                "status": profile.status,
                "risk_score": profile.risk_score,
                "anchor_type": profile.anchor_type,
                "anchor_value": profile.anchor_value,
                "source_departments": profile.source_departments,
                "record_count": len(profile.record_ids) if profile.record_ids else 0
            }
        
        record = db.query(BusinessRecord).filter(BusinessRecord.gst == gst_upper).first()
        if record and record.ubid:
            profile = db.query(UBIDProfile).filter(UBIDProfile.ubid == record.ubid).first()
            if profile:
                return {
                    "found": True,
                    "identification_method": "GST (via record)",
                    "ubid": profile.ubid,
                    "canonical_name": profile.canonical_name,
                    "status": profile.status,
                    "risk_score": profile.risk_score,
                    "anchor_type": profile.anchor_type,
                    "anchor_value": profile.anchor_value,
                    "source_departments": profile.source_departments,
                    "record_count": len(profile.record_ids) if profile.record_ids else 0
                }
    
    # Case 3: Search by name (returns multiple matches)
    if name:
        name_lower = name.lower().strip()
        
        # Search in UBIDProfile canonical_name
        profiles = db.query(UBIDProfile).filter(
            UBIDProfile.canonical_name.ilike(f"%{name_lower}%")
        ).limit(10).all()
        
        if profiles:
            return {
                "found": True,
                "identification_method": "NAME_SEARCH",
                "multiple_matches": True,
                "count": len(profiles),
                "matches": [{
                    "ubid": p.ubid,
                    "canonical_name": p.canonical_name,
                    "status": p.status,
                    "risk_score": p.risk_score,
                    "anchor_type": p.anchor_type,
                    "anchor_value": p.anchor_value
                } for p in profiles]
            }
        
        # Search in BusinessRecord names
        records = db.query(BusinessRecord).filter(
            BusinessRecord.name.ilike(f"%{name_lower}%")
        ).limit(10).all()
        
        ubid_set = set()
        for record in records:
            if record.ubid:
                ubid_set.add(record.ubid)
        
        if ubid_set:
            profiles = db.query(UBIDProfile).filter(UBIDProfile.ubid.in_(ubid_set)).all()
            return {
                "found": True,
                "identification_method": "NAME_SEARCH (via records)",
                "multiple_matches": True,
                "count": len(profiles),
                "matches": [{
                    "ubid": p.ubid,
                    "canonical_name": p.canonical_name,
                    "status": p.status,
                    "risk_score": p.risk_score,
                    "anchor_type": p.anchor_type,
                    "anchor_value": p.anchor_value
                } for p in profiles]
            }
    
    # No matches found
    return {
        "found": False,
        "message": f"No UBID found for provided identifier(s)",
        "queried": {k: v for k, v in {"pan": pan, "gst": gst, "name": name}.items() if v}
    }

@router.get("/api/ubid/search")
async def search_ubid_by_name(
    q: str = Query(..., min_length=2, description="Business name to search"),
    db: Session = Depends(get_db)
):
    """Search UBID profiles by business name (partial match)."""
    profiles = db.query(UBIDProfile).filter(
        UBIDProfile.canonical_name.ilike(f"%{q}%")
    ).limit(20).all()
    
    if not profiles:
        # Fallback to record search
        records = db.query(BusinessRecord).filter(
            BusinessRecord.name.ilike(f"%{q}%")
        ).limit(20).all()
        
        ubid_set = {r.ubid for r in records if r.ubid}
        if ubid_set:
            profiles = db.query(UBIDProfile).filter(UBIDProfile.ubid.in_(ubid_set)).all()
    
    return {
        "query": q,
        "count": len(profiles),
        "results": [{
            "ubid": p.ubid,
            "canonical_name": p.canonical_name,
            "status": p.status,
            "risk_score": p.risk_score,
            "anchor_type": p.anchor_type,
            "anchor_value": p.anchor_value,
            "source_departments": p.source_departments
        } for p in profiles]
    }

@router.get("/api/ubid/{ubid}/profile")
async def get_ubid_full_profile(ubid: str, db: Session = Depends(get_db)):
    """Get complete profile for a UBID including all records, events, and lifecycle."""
    profile = db.query(UBIDProfile).filter(UBIDProfile.ubid == ubid).first()
    if not profile:
        raise HTTPException(status_code=404, detail="UBID not found")
    
    # Get all records
    records = db.query(BusinessRecord).filter(BusinessRecord.ubid == ubid).all()
    
    # Derive canonical_address — most frequent non-empty address across linked records
    addresses = [r.address for r in records if r.address and r.address.strip()]
    canonical_address = max(set(addresses), key=addresses.count) if addresses else None
    
    # Get all events
    events = db.query(Event).filter(Event.ubid == ubid).order_by(Event.event_date.desc()).all()
    
    # Get audit logs
    from app.models.database import AuditLog
    audits = db.query(AuditLog).filter(AuditLog.entity_id == ubid).order_by(AuditLog.created_at.desc()).limit(50).all()
    
    # Build department registration summary
    dept_summary = {}
    for r in records:
        dept = r.source_department or "Unknown"
        if dept not in dept_summary:
            dept_summary[dept] = {"record_count": 0, "names": []}
        dept_summary[dept]["record_count"] += 1
        if r.name and r.name not in dept_summary[dept]["names"]:
            dept_summary[dept]["names"].append(r.name)
    
    return {
        "profile": {
            "ubid": profile.ubid,
            "canonical_name": profile.canonical_name,
            "canonical_address": canonical_address,
            "status": profile.status,
            "risk_score": profile.risk_score,
            "anchor_type": profile.anchor_type,
            "anchor_value": profile.anchor_value,
            "source_departments": profile.source_departments,
            "department_registrations": dept_summary,
            "total_records": len(records),
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
            "updated_at": profile.updated_at.isoformat() if profile.updated_at else None
        },
        "records": [{
            "id": r.id,
            "name": r.name,
            "address": r.address,
            "phone": r.phone,
            "pan": r.pan,
            "gst": r.gst,
            "source_department": r.source_department,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in records],
        "events": [{
            "id": e.id,
            "department": e.department,
            "event_type": e.event_type,
            "event_date": e.event_date.isoformat() if e.event_date else None,
            "description": e.description
        } for e in events],
        "audit_trail": [{
            "action": a.action,
            "details": a.details,
            "actor": a.actor,
            "created_at": a.created_at.isoformat() if a.created_at else None
        } for a in audits]
    }