from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app.models.database import get_db, UBIDProfile, BusinessRecord, Event
from app.models.schemas import AnalyticsQuerySchema
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

router = APIRouter()

@router.post("/api/analytics/query")
async def run_analytics(query: AnalyticsQuerySchema, db: Session = Depends(get_db)):
    """
    Cross-department data querying with multiple filters.
    Returns businesses matching criteria — used by AnalyticsPanel.
    """
    profile_query = db.query(UBIDProfile)

    # Filter by status
    if query.status:
        profile_query = profile_query.filter(UBIDProfile.status == query.status)

    profiles = profile_query.all()

    # Filter by pincode (check associated records)
    if query.pincode and query.pincode.strip():
        filtered = []
        for profile in profiles:
            records = db.query(BusinessRecord).filter(BusinessRecord.ubid == profile.ubid).all()
            if any(query.pincode in (r.address or '') for r in records):
                filtered.append(profile)
        profiles = filtered

    # Filter by missing event type (partial, case-insensitive)
    if query.missing_event_type and query.missing_event_months:
        cutoff_date = datetime.utcnow() - timedelta(days=query.missing_event_months * 30)
        filtered = []
        event_type_lower = query.missing_event_type.lower()

        for profile in profiles:
            # Partial match: "Inspection" matches "Safety Inspection", "Fire Inspection" etc.
            event_exists = db.query(Event).filter(
                Event.ubid == profile.ubid,
                Event.event_type.ilike(f"%{query.missing_event_type}%"),
                Event.event_date >= cutoff_date
            ).first()

            if not event_exists:
                # Also check orphaned events (not yet attached) for this business name
                records = db.query(BusinessRecord).filter(BusinessRecord.ubid == profile.ubid).all()
                business_names = [r.name for r in records if r.name]
                orphan_with_match = None
                if business_names:
                    orphan_with_match = db.query(Event).filter(
                        Event.ubid.is_(None),
                        Event.event_type.ilike(f"%{query.missing_event_type}%"),
                        Event.business_name.in_(business_names),
                        Event.event_date >= cutoff_date
                    ).first()

                # Include in results only if no matching event (attached or orphaned)
                if not orphan_with_match:
                    filtered.append(profile)

        profiles = filtered

    # Build response
    response_data = []
    for profile in profiles[:50]:
        records = db.query(BusinessRecord).filter(BusinessRecord.ubid == profile.ubid).all()
        record_count = len(records)
        event_count = db.query(Event).filter(Event.ubid == profile.ubid).count()

        # Derive canonical_address from most common address
        addresses = [r.address for r in records if r.address and r.address.strip()]
        canonical_address = max(set(addresses), key=addresses.count) if addresses else "Address not available"

        # Count missing events for this business
        cutoff = datetime.utcnow() - timedelta(days=(query.missing_event_months or 18) * 30)
        missing_event_count = 0
        if query.missing_event_type:
            matched_events = db.query(Event).filter(
                Event.ubid == profile.ubid,
                Event.event_type.ilike(f"%{query.missing_event_type}%"),
                Event.event_date >= cutoff
            ).count()
            missing_event_count = 1 if matched_events == 0 else 0

        response_data.append({
            "ubid": profile.ubid,
            "canonical_name": profile.canonical_name,
            "name": profile.canonical_name,
            "canonical_address": canonical_address,
            "status": profile.status,
            "risk_score": profile.risk_score,
            "anchor_type": profile.anchor_type,
            "record_count": record_count,
            "event_count": event_count,
            "missing_compliance_events": missing_event_count,
            "source_departments": profile.source_departments or []
        })

    return {
        "message": "Query successful",
        "count": len(response_data),
        "data": response_data
    }


@router.get("/api/analytics/summary")
async def get_analytics_summary(db: Session = Depends(get_db)):
    """Get summary statistics for all businesses."""
    total_businesses = db.query(UBIDProfile).count()
    active_count = db.query(UBIDProfile).filter(UBIDProfile.status == "ACTIVE").count()
    dormant_count = db.query(UBIDProfile).filter(UBIDProfile.status == "DORMANT").count()
    closed_count = db.query(UBIDProfile).filter(UBIDProfile.status == "CLOSED").count()
    
    # High risk businesses (score > 70)
    high_risk_count = db.query(UBIDProfile).filter(UBIDProfile.risk_score > 70).count()
    
    # Department distribution
    all_profiles = db.query(UBIDProfile).all()
    department_counts = {}
    for profile in all_profiles:
        if profile.source_departments:
            for dept in profile.source_departments:
                department_counts[dept] = department_counts.get(dept, 0) + 1
    
    # Total records
    total_records = db.query(BusinessRecord).count()
    total_events = db.query(Event).count()
    
    return {
        "summary": {
            "total_businesses": total_businesses,
            "active_businesses": active_count,
            "dormant_businesses": dormant_count,
            "closed_businesses": closed_count,
            "high_risk_businesses": high_risk_count,
            "total_records": total_records,
            "total_events": total_events
        },
        "department_distribution": department_counts,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/api/analytics/department/{department}")
async def get_department_analytics(department: str, db: Session = Depends(get_db)):
    """Get analytics for a specific department."""
    # Find all records from this department
    records = db.query(BusinessRecord).filter(
        BusinessRecord.source_department == department
    ).all()
    
    # Get unique UBIDs
    ubid_set = {r.ubid for r in records if r.ubid}
    
    # Get profiles for these UBIDs
    profiles = db.query(UBIDProfile).filter(UBIDProfile.ubid.in_(ubid_set)).all()
    
    # Count by status
    status_counts = {
        "ACTIVE": 0,
        "DORMANT": 0,
        "CLOSED": 0
    }
    for profile in profiles:
        if profile.status in status_counts:
            status_counts[profile.status] += 1
    
    # Calculate average risk score
    avg_risk = sum(p.risk_score for p in profiles) / len(profiles) if profiles else 0
    
    return {
        "department": department,
        "total_records": len(records),
        "unique_businesses": len(ubid_set),
        "status_distribution": status_counts,
        "average_risk_score": round(avg_risk, 2),
        "businesses": [{
            "ubid": p.ubid,
            "name": p.canonical_name,
            "status": p.status,
            "risk_score": p.risk_score
        } for p in profiles[:20]]
    }

@router.get("/api/analytics/trends")
async def get_analytics_trends(
    months: int = Query(12, description="Number of months to analyze"),
    db: Session = Depends(get_db)
):
    """Get business registration and activity trends over time."""
    cutoff_date = datetime.utcnow() - timedelta(days=months * 30)
    
    # Registration trends (by record creation)
    records_by_month = db.query(
        func.strftime('%Y-%m', BusinessRecord.created_at).label('month'),
        func.count(BusinessRecord.id).label('count')
    ).filter(BusinessRecord.created_at >= cutoff_date).group_by('month').order_by('month').all()
    
    # Activity trends (by events)
    events_by_month = db.query(
        func.strftime('%Y-%m', Event.event_date).label('month'),
        func.count(Event.id).label('count')
    ).filter(Event.event_date >= cutoff_date).group_by('month').order_by('month').all()
    
    # Status changes over time
    profiles = db.query(UBIDProfile).filter(UBIDProfile.created_at >= cutoff_date).all()
    status_by_month = {}
    for profile in profiles:
        month = profile.created_at.strftime('%Y-%m')
        if month not in status_by_month:
            status_by_month[month] = {"ACTIVE": 0, "DORMANT": 0, "CLOSED": 0}
        if profile.status in status_by_month[month]:
            status_by_month[month][profile.status] += 1
    
    return {
        "period_months": months,
        "registration_trends": [{"month": r[0], "new_registrations": r[1]} for r in records_by_month],
        "activity_trends": [{"month": e[0], "total_events": e[1]} for e in events_by_month],
        "status_trends": status_by_month,
        "timestamp": datetime.utcnow().isoformat()
    }