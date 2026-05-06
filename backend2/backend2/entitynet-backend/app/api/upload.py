from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.models.database import get_db, BusinessRecord
from app.services.matcher import EntityMatcher
from app.services.clusterer import Clusterer
from app.utils.csv_parser import parse_csv
import uuid

router = APIRouter()


@router.post("/api/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Ingest a CSV, then immediately run entity matching and clustering so
    the Entity Engine and Knowledge Graph reflect the new data right away.
    """
    # ── 1. Parse CSV ─────────────────────────────────────────────────────────
    records_data = await parse_csv(file)

    # ── 2. Persist records ────────────────────────────────────────────────────
    saved_records = []
    
    # Garbage names that usually mean misaligned CSV columns or missing data
    garbage_names = {"industry", "labour", "municipal", "unknown", "—", "-", "test_name", "na", "n/a"}

    for record_data in records_data:
        raw_name = str(record_data.get("name", "")).strip()
        
        # Skip garbage data
        if not raw_name or raw_name.lower() in garbage_names:
            continue
            
        record = BusinessRecord(
            id=str(uuid.uuid4()),
            name=raw_name,
            address=record_data.get("address", ""),
            phone=record_data.get("phone", ""),
            pan=record_data.get("pan", ""),
            gst=record_data.get("gst", ""),
            source_department=record_data.get("department", "Unknown"),
            raw_data=record_data,
        )
        db.add(record)
        saved_records.append(record)
    db.commit()

    # ── 3. Auto-match ─────────────────────────────────────────────────────────
    matcher = EntityMatcher(db)
    match_result = matcher.run_matching()

    # ── 4. Auto-cluster (upsert, no duplicates) ───────────────────────────────
    clusterer = Clusterer(db)
    profiles = clusterer.assign_ubids()

    # ── 5. Return rich analysis summary ──────────────────────────────────────
    return {
        "message": f"Ingested {len(saved_records)} records",
        "records_ingested": len(saved_records),
        "matching": {
            "auto_merged": match_result.get("autoMerged", 0),
            "pending_review": match_result.get("pendingReview", 0),
            "total_pairs_evaluated": match_result.get("total", 0),
        },
        "clustering": {
            "ubid_profiles_total": len(profiles),
            "profiles": [
                {
                    "ubid": p.ubid,
                    "canonical_name": p.canonical_name,
                    "departments": p.source_departments or [],
                    "record_count": len(p.record_ids) if p.record_ids else 0,
                }
                for p in profiles
            ],
        },
        "data": [{"id": r.id, "name": r.name} for r in saved_records],
    }