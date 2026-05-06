from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.database import get_db, UBIDProfile, BusinessRecord, Event, AuditLog
from datetime import datetime, timedelta
from typing import List, Dict, Any
import re

router = APIRouter()

@router.post("/api/anomalies/evaluate")
async def evaluate_anomalies(db: Session = Depends(get_db)):
    """
    Triggers anomaly detection engine for all businesses.
    Detects: identity reuse, ghost entities, address mismatch, shell companies.
    """
    profiles = db.query(UBIDProfile).all()
    anomalies_found = 0
    
    for profile in profiles:
        risk_score = 0
        anomalies = []
        
        # Get all records for this UBID
        records = db.query(BusinessRecord).filter(BusinessRecord.ubid == profile.ubid).all()
        
        if not records:
            continue
        
        # 1. Phone number reuse across multiple records
        phones = [r.phone for r in records if r.phone and r.phone.strip()]
        if len(set(phones)) < len(phones):
            risk_score += 30
            anomalies.append({
                "type": "Identity Reuse",
                "severity": "HIGH",
                "details": f"Phone number used across {len(phones)} records"
            })
        
        # 2. Multiple addresses detected (potential fraud)
        addresses = [r.address for r in records if r.address and r.address.strip()]
        if len(set(addresses)) > 1:
            risk_score += 20
            anomalies.append({
                "type": "Address Mismatch",
                "severity": "MEDIUM",
                "details": f"Business registered with {len(set(addresses))} different addresses"
            })
        
        # 3. Name variations (potential shell company)
        names = [r.name.lower() for r in records if r.name]
        unique_names = len(set(names))
        if unique_names > 2:
            risk_score += 25
            anomalies.append({
                "type": "Name Variation",
                "severity": "MEDIUM",
                "details": f"Business appears as {unique_names} different names across departments"
            })
        
        # 4. Ghost entity check (no events/activity)
        events_count = db.query(Event).filter(Event.ubid == profile.ubid).count()
        if events_count == 0:
            days_since_registration = (datetime.utcnow() - profile.created_at).days
            if days_since_registration > 180:  # 6 months
                risk_score += 35
                anomalies.append({
                    "type": "Ghost Entity",
                    "severity": "HIGH",
                    "details": f"No activity in {days_since_registration} days since registration"
                })
        
        # 5. Check for suspicious PAN/GST patterns
        if profile.anchor_type in ["PAN", "GST"]:
            anchor_value = profile.anchor_value
            # Check if PAN is invalid format
            if profile.anchor_type == "PAN" and not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', anchor_value):
                risk_score += 40
                anomalies.append({
                    "type": "Invalid Identifier",
                    "severity": "HIGH",
                    "details": f"{profile.anchor_type} '{anchor_value}' does not match standard format"
                })
        
        # 6. Cross-department compliance gap
        departments = set()
        for record in records:
            departments.add(record.source_department)
        
        if len(departments) >= 3:
            # Check if any department has no recent events
            for dept in departments:
                dept_events = db.query(Event).filter(
                    Event.ubid == profile.ubid,
                    Event.department == dept,
                    Event.event_date >= (datetime.utcnow() - timedelta(days=365))
                ).count()
                
                if dept_events == 0:
                    risk_score += 15
                    anomalies.append({
                        "type": "Compliance Gap",
                        "severity": "MEDIUM",
                        "details": f"Registered with {dept} but no filings in last 12 months"
                    })
                    break
        
        # 7. Rapid registration pattern (potential shell company)
        if len(records) >= 5:
            dates = [r.created_at for r in records]
            date_range = (max(dates) - min(dates)).days if len(dates) > 1 else 0
            if date_range < 30:
                risk_score += 30
                anomalies.append({
                    "type": "Rapid Registration",
                    "severity": "HIGH",
                    "details": f"{len(records)} registrations in {date_range} days"
                })
        
        # Cap risk score at 100
        risk_score = min(risk_score, 100)
        
        # Update profile
        profile.risk_score = risk_score
        
        # Log anomalies to audit trail
        for anomaly in anomalies:
            audit = AuditLog(
                entity_id=profile.ubid,
                action=f"ANOMALY_DETECTED_{anomaly['type'].upper().replace(' ', '_')}",
                details=anomaly,
                actor="System AI"
            )
            db.add(audit)
        
        if anomalies:
            anomalies_found += 1
        db.commit()
    
    return {
        "message": f"Anomaly evaluation complete. Scanned {len(profiles)} businesses.",
        "anomalies_detected": anomalies_found,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/api/anomalies")
async def get_anomalies(
    min_risk_score: int = Query(0, description="Minimum risk score to include (0-100)"),
    anomaly_type: str = Query(None, description="Filter by anomaly type"),
    limit: int = Query(50, description="Max results to return"),
    db: Session = Depends(get_db)
):
    """
    Fetch anomalies for RiskIntelligence panel.
    Returns { stats: {total, high, medium, low}, data: [...] }
    """
    # All profiles with any risk
    all_profiles = db.query(UBIDProfile).all()

    results = []
    for profile in all_profiles:
        # Get anomaly logs
        anomaly_logs = db.query(AuditLog).filter(
            AuditLog.entity_id == profile.ubid,
            AuditLog.action.like("ANOMALY_DETECTED%")
        ).order_by(AuditLog.created_at.desc()).all()

        detected_anomalies = []
        for log in anomaly_logs:
            if log.details:
                entry = dict(log.details)
                entry["detected_at"] = log.created_at.isoformat() if log.created_at else None
                detected_anomalies.append(entry)

        # Auto-generate anomaly description from risk score if no audit logs yet
        if not detected_anomalies and profile.risk_score > 0:
            detected_anomalies = [{
                "type": "General Risk",
                "severity": "HIGH" if profile.risk_score >= 70 else "MEDIUM" if profile.risk_score >= 40 else "LOW",
                "details": "Risk indicators detected — run the scanner for detailed breakdown",
                "detected_at": profile.updated_at.isoformat() if profile.updated_at else None
            }]

        # Also check compliance: ghost entity (no events)
        events_count = db.query(Event).filter(Event.ubid == profile.ubid).count()
        if events_count == 0:
            days_old = (datetime.utcnow() - profile.created_at).days if profile.created_at else 0
            if days_old > 30:
                detected_anomalies.append({
                    "type": "No Activity",
                    "severity": "MEDIUM",
                    "details": f"Business has no recorded events since registration ({days_old} days ago)",
                    "detected_at": datetime.utcnow().isoformat()
                })

        # Filter by anomaly_type
        if anomaly_type:
            detected_anomalies = [a for a in detected_anomalies if anomaly_type.lower() in a.get("type", "").lower()]

        if not detected_anomalies:
            continue

        # Determine severity bracket
        risk = float(profile.risk_score or 0)
        if risk >= 70:
            severity = "HIGH"
        elif risk >= 40:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        results.append({
            "id": profile.ubid,
            "ubid": profile.ubid,
            "canonical_name": profile.canonical_name,
            "risk_score": int(risk),
            "status": profile.status,
            "anomaly_type": detected_anomalies[0].get("type", "Unknown"),
            "reason": detected_anomalies[0].get("details", ""),
            "severity": severity,
            "anomalies": detected_anomalies,
            "total_records": len(profile.record_ids) if profile.record_ids else 0
        })

    # Apply min_risk_score filter
    results = [r for r in results if r["risk_score"] >= min_risk_score]
    # Sort by risk score descending
    results.sort(key=lambda x: x["risk_score"], reverse=True)
    results = results[:limit]

    # Compute stats
    high = sum(1 for r in results if r["risk_score"] >= 70)
    medium = sum(1 for r in results if 40 <= r["risk_score"] < 70)
    low = sum(1 for r in results if r["risk_score"] < 40)

    # If DB has no anomaly logs yet, auto-populate with profiles that have risk > 0
    if not results:
        risky = db.query(UBIDProfile).filter(UBIDProfile.risk_score > 0).order_by(
            UBIDProfile.risk_score.desc()
        ).limit(limit).all()

        for profile in risky:
            risk = float(profile.risk_score)
            results.append({
                "id": profile.ubid,
                "ubid": profile.ubid,
                "canonical_name": profile.canonical_name,
                "risk_score": int(risk),
                "status": profile.status,
                "anomaly_type": "Pending Evaluation",
                "reason": "Run the Risk Scanner to get detailed anomaly breakdown",
                "severity": "HIGH" if risk >= 70 else "MEDIUM" if risk >= 40 else "LOW",
                "anomalies": [],
                "total_records": len(profile.record_ids) if profile.record_ids else 0
            })
        high = sum(1 for r in results if r["risk_score"] >= 70)
        medium = sum(1 for r in results if 40 <= r["risk_score"] < 70)
        low = sum(1 for r in results if r["risk_score"] < 40)

    return {
        "stats": {
            "total": len(results),
            "high": high,
            "medium": medium,
            "low": low
        },
        "data": results
    }


@router.get("/api/anomalies/{ubid}")
async def get_business_anomalies(ubid: str, db: Session = Depends(get_db)):
    """Get detailed anomalies for a specific business."""
    profile = db.query(UBIDProfile).filter(UBIDProfile.ubid == ubid).first()
    if not profile:
        raise HTTPException(status_code=404, detail="UBID not found")
    
    # Get anomalies from audit logs
    anomalies_logs = db.query(AuditLog).filter(
        AuditLog.entity_id == ubid,
        AuditLog.action.like("ANOMALY_DETECTED%")
    ).order_by(AuditLog.created_at.desc()).all()
    
    anomalies = []
    for log in anomalies_logs:
        if log.details:
            anomaly = log.details
            anomaly["detected_at"] = log.created_at.isoformat() if log.created_at else None
            anomalies.append(anomaly)
    
    # Get records for evidence
    records = db.query(BusinessRecord).filter(BusinessRecord.ubid == ubid).all()
    events_count = db.query(Event).filter(Event.ubid == ubid).count()
    
    return {
        "ubid": profile.ubid,
        "canonical_name": profile.canonical_name,
        "risk_score": profile.risk_score,
        "status": profile.status,
        "anomalies": anomalies,
        "summary": {
            "total_records": len(records),
            "total_events": events_count,
            "departments": list(set(r.source_department for r in records)),
            "first_registration": min(r.created_at for r in records).isoformat() if records else None,
            "last_activity": profile.updated_at.isoformat() if profile.updated_at else None
        },
        "records": [{
            "id": r.id,
            "name": r.name,
            "address": r.address,
            "phone": r.phone,
            "pan": r.pan,
            "gst": r.gst,
            "source_department": r.source_department
        } for r in records]
    }

@router.get("/api/anomalies/summary")
async def get_anomalies_summary(db: Session = Depends(get_db)):
    """Get summary statistics of all anomalies."""
    total_businesses = db.query(UBIDProfile).count()
    
    # Risk score distribution
    low_risk = db.query(UBIDProfile).filter(UBIDProfile.risk_score < 30).count()
    medium_risk = db.query(UBIDProfile).filter(UBIDProfile.risk_score.between(30, 69)).count()
    high_risk = db.query(UBIDProfile).filter(UBIDProfile.risk_score >= 70).count()
    
    # Average risk score
    avg_risk = db.query(func.avg(UBIDProfile.risk_score)).scalar() or 0
    
    # Anomaly type distribution from audit logs
    anomaly_types = db.query(
        AuditLog.action,
        func.count(AuditLog.id).label('count')
    ).filter(
        AuditLog.action.like("ANOMALY_DETECTED%")
    ).group_by(AuditLog.action).all()
    
    anomaly_distribution = {}
    for action, count in anomaly_types:
        # Clean up action name
        type_name = action.replace("ANOMALY_DETECTED_", "").replace("_", " ").title()
        anomaly_distribution[type_name] = count
    
    return {
        "total_businesses": total_businesses,
        "risk_distribution": {
            "low_risk_0_30": low_risk,
            "medium_risk_30_69": medium_risk,
            "high_risk_70_100": high_risk
        },
        "average_risk_score": round(avg_risk, 2),
        "anomaly_type_distribution": anomaly_distribution,
        "timestamp": datetime.utcnow().isoformat()
    }