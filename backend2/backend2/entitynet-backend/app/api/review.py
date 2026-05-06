from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db, MatchLink, BusinessRecord, UBIDProfile, AuditLog
from app.models.schemas import ReviewDecisionSchema
from app.services.clusterer import Clusterer
from datetime import datetime
import uuid

router = APIRouter()


@router.get("/api/review/pending")
async def get_pending_reviews(db: Session = Depends(get_db)):
    pending_links = db.query(MatchLink).filter(MatchLink.decision == "PENDING_REVIEW").all()

    result = []
    for link in pending_links:
        record1 = db.query(BusinessRecord).get(link.record_1_id)
        record2 = db.query(BusinessRecord).get(link.record_2_id)

        if not record1 or not record2:
            continue  # skip orphaned links

        result.append({
            "id": link.id,
            "similarity_score": link.similarity_score,
            "decision_reason": link.decision_reason,
            "matched_fields": link.matched_fields,
            "record1": {
                "id": record1.id,
                "name": record1.name,
                "address": record1.address,
                "pan": record1.pan,
                "gst": record1.gst,
                "source_department": record1.source_department,
                "ubid": record1.ubid
            },
            "record2": {
                "id": record2.id,
                "name": record2.name,
                "address": record2.address,
                "pan": record2.pan,
                "gst": record2.gst,
                "source_department": record2.source_department,
                "ubid": record2.ubid
            }
        })

    return result


@router.post("/api/review")
async def submit_review(decision: ReviewDecisionSchema, db: Session = Depends(get_db)):
    """
    Handle human review decision: APPROVE (merge), REJECT, or DEFER.

    APPROVE  → promotes link to AUTO_MERGE → re-runs clusterer → records get merged UBID
    REJECT   → marks link REJECTED → records stay separate → audit log written to both profiles
    DEFER    → marks link DEFERRED → stays in queue until revisited
    """
    link = db.query(MatchLink).filter(MatchLink.id == decision.link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Match link not found")

    record1 = db.query(BusinessRecord).get(link.record_1_id)
    record2 = db.query(BusinessRecord).get(link.record_2_id)

    if not record1 or not record2:
        raise HTTPException(status_code=404, detail="One or both records not found")

    dept1 = record1.source_department or "Unknown"
    dept2 = record2.source_department or "Unknown"
    name1 = record1.name or "Unknown"
    name2 = record2.name or "Unknown"

    # ── APPROVE: Merge the two records into one UBID ──────────────────────────
    if decision.decision == "APPROVE":
        link.decision = "AUTO_MERGE"
        db.commit()

        # Re-run clustering → the two records will now be in same component
        clusterer = Clusterer(db)
        clusterer.assign_ubids()
        db.refresh(record1)
        db.refresh(record2)

        # Both records should now share the same UBID
        merged_ubid = record1.ubid or record2.ubid
        profile = None
        if merged_ubid:
            profile = db.query(UBIDProfile).filter(UBIDProfile.ubid == merged_ubid).first()

        # Write audit log on the merged profile
        if profile:
            audit = AuditLog(
                entity_id=profile.ubid,
                action="HUMAN_REVIEW_MERGE",
                details={
                    "decision": "APPROVED",
                    "record_1_id": record1.id,
                    "record_2_id": record2.id,
                    "dept_1": dept1,
                    "dept_2": dept2,
                    "name_1": name1,
                    "name_2": name2,
                    "similarity_score": link.similarity_score,
                    "message": f"Human reviewer approved merge: '{name1}' ({dept1}) merged with '{name2}' ({dept2})"
                },
                actor="HUMAN_REVIEWER",
                created_at=datetime.utcnow()
            )
            db.add(audit)
            db.commit()

        return {
            "message": f"✅ Approved. '{name1}' ({dept1}) and '{name2}' ({dept2}) merged into one UBID.",
            "decision": "APPROVED",
            "resultingProfile": {
                "ubid": profile.ubid if profile else merged_ubid,
                "canonical_name": profile.canonical_name if profile else name1,
                "anchor_type": profile.anchor_type if profile else "NAME",
                "source_departments": profile.source_departments if profile else [dept1, dept2]
            } if (profile or merged_ubid) else None
        }

    # ── REJECT: Keep records separate, log the decision ───────────────────────
    elif decision.decision == "REJECT":
        link.decision = "REJECTED"

        # Write audit log to both records' UBID profiles
        for rec in [record1, record2]:
            if rec.ubid:
                audit = AuditLog(
                    entity_id=rec.ubid,
                    action="HUMAN_REVIEW_REJECTED",
                    details={
                        "decision": "REJECTED",
                        "linked_record_name": name2 if rec == record1 else name1,
                        "linked_record_dept": dept2 if rec == record1 else dept1,
                        "this_record_dept": dept1 if rec == record1 else dept2,
                        "similarity_score": link.similarity_score,
                        "message": f"Human reviewer rejected merge: '{name1}' ({dept1}) and '{name2}' ({dept2}) are NOT the same business"
                    },
                    actor="HUMAN_REVIEWER",
                    created_at=datetime.utcnow()
                )
                db.add(audit)

        db.commit()

        return {
            "message": f"❌ Rejected. '{name1}' ({dept1}) and '{name2}' ({dept2}) kept as separate entities.",
            "decision": "REJECTED",
            "resultingProfile": None
        }

    # ── DEFER: Leave for later review ─────────────────────────────────────────
    elif decision.decision == "DEFER":
        link.decision = "DEFERRED"
        db.commit()

        return {
            "message": f"🕐 Deferred. '{name1}' ({dept1}) vs '{name2}' ({dept2}) will stay in the queue.",
            "decision": "DEFERRED",
            "resultingProfile": None
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unknown decision: {decision.decision}")