from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db, MatchLink, UBIDProfile, BusinessRecord
from app.services.clusterer import Clusterer
from app.services.matcher import EntityMatcher

router = APIRouter()


@router.post("/api/cluster")
async def run_clustering(db: Session = Depends(get_db)):
    clusterer = Clusterer(db)
    profiles = clusterer.assign_ubids()

    profile_data = [{
        "ubid": p.ubid,
        "canonical_name": p.canonical_name,
        "record_count": len(p.record_ids or [])
    } for p in profiles]

    return {
        "message": f"Clustering complete. {len(profiles)} UBID profiles resolved.",
        "data": profile_data
    }


@router.post("/api/cluster/re-run")
async def re_run_full_pipeline(db: Session = Depends(get_db)):
    """
    Full re-clustering pipeline:
    1. Delete ALL old MatchLinks (stale decisions from old thresholds)
    2. Clear UBID assignments on all records
    3. Delete all old UBID profiles
    4. Re-run matching with improved normalizer + new thresholds
    5. Re-run clustering → produces deduplicated UBID profiles
    """
    # Step 1: Delete stale match links
    db.query(MatchLink).delete()

    # Step 2: Reset UBID on all records
    db.query(BusinessRecord).update({"ubid": None})

    # Step 3: Delete all UBID profiles
    db.query(UBIDProfile).delete()

    db.commit()

    # Step 4: Re-match with new improved scorer
    matcher = EntityMatcher(db)
    match_results = matcher.run_matching()

    # Step 5: Re-cluster → deduplicated profiles
    clusterer = Clusterer(db)
    profiles = clusterer.assign_ubids()

    profile_data = [{
        "ubid": p.ubid,
        "canonical_name": p.canonical_name,
        "departments": p.source_departments,
        "record_count": len(p.record_ids or [])
    } for p in profiles]

    return {
        "message": f"Re-clustering complete. {len(profiles)} deduplicated UBID profiles created.",
        "matching": match_results,
        "profiles": profile_data
    }