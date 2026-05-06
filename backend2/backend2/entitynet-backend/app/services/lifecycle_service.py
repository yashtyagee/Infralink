from sqlalchemy.orm import Session
from app.models.database import UBIDProfile, BusinessRecord, Event
from datetime import datetime, timedelta
import numpy as np
from typing import Dict, Any

class LifecycleService:
    def __init__(self, db: Session):
        self.db = db
    
    def evaluate_business_lifecycle(self, ubid: str) -> Dict[str, Any]:
        """
        Determine if a business is ACTIVE, DORMANT, or CLOSED.
        Uses survival analysis approach with event recency and filing patterns.
        """
        profile = self.db.query(UBIDProfile).filter(UBIDProfile.ubid == ubid).first()
        if not profile:
            return {"error": "UBID not found"}
        
        # Get all events (filings, inspections, payments) for this UBID
        events = self.db.query(Event).filter(Event.ubid == ubid).order_by(Event.event_date.desc()).all()
        
        # If no events, check record creation date as proxy
        records = self.db.query(BusinessRecord).filter(BusinessRecord.ubid == ubid).all()
        if not records and not events:
            return {"status": "UNKNOWN", "confidence": 0, "reason": "No data available"}
        
        # Calculate days since last activity
        last_activity_date = None
        if events:
            last_activity_date = events[0].event_date
        else:
            # Use most recent record creation date
            last_activity_date = max(r.created_at for r in records)
        
        days_inactive = (datetime.utcnow() - last_activity_date).days
        
        # Count frequency of events in last 12 months
        one_year_ago = datetime.utcnow() - timedelta(days=365)
        recent_events = [e for e in events if e.event_date >= one_year_ago]
        event_count_12m = len(recent_events)
        
        # Determine status based on rules (can be enhanced with Cox PH model)
        if days_inactive <= 30 and event_count_12m >= 1:
            status = "ACTIVE"
            confidence = min(0.9 + (event_count_12m / 20), 0.99)
            reason = f"Active activity within {days_inactive} days, {event_count_12m} events in 12 months"
        elif days_inactive <= 90:
            status = "ACTIVE"  # Still considered active but lower confidence
            confidence = 0.7
            reason = f"Last activity {days_inactive} days ago, moderate activity"
        elif days_inactive <= 365:
            status = "DORMANT"
            confidence = 0.8
            reason = f"No activity for {days_inactive} days, but less than a year"
        else:
            status = "CLOSED"
            confidence = 0.85
            reason = f"No activity for {days_inactive} days (over 1 year)"
        
        # Additional check: if multiple departments show no filings, increase dormancy likelihood
        if status == "ACTIVE" and event_count_12m == 0 and days_inactive > 60:
            status = "DORMANT"
            confidence = 0.75
            reason = "No event filings in last 12 months despite being registered"
        
        return {
            "ubid": ubid,
            "status": status,
            "confidence": round(confidence, 2),
            "days_inactive": days_inactive,
            "last_activity_date": last_activity_date.isoformat() if last_activity_date else None,
            "event_count_12m": event_count_12m,
            "reason": reason
        }
    
    def evaluate_all_lifecycles(self) -> list:
        """Evaluate lifecycle for all UBID profiles and update database."""
        profiles = self.db.query(UBIDProfile).all()
        results = []
        for profile in profiles:
            result = self.evaluate_business_lifecycle(profile.ubid)
            if "error" not in result:
                # Update profile status
                profile.status = result["status"]
                self.db.commit()
            results.append(result)
        return results