from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.services.lifecycle_service import LifecycleService

router = APIRouter()

@router.post("/api/lifecycle/evaluate")
async def evaluate_lifecycle(db: Session = Depends(get_db)):
    """
    Trigger lifecycle evaluation for all businesses.
    Returns status (ACTIVE/DORMANT/CLOSED) for each UBID.
    """
    service = LifecycleService(db)
    results = service.evaluate_all_lifecycles()
    return {
        "message": f"Evaluated {len(results)} businesses",
        "data": results
    }

@router.get("/api/lifecycle/{ubid}")
async def get_lifecycle(ubid: str, db: Session = Depends(get_db)):
    """Get lifecycle status for a single UBID."""
    service = LifecycleService(db)
    result = service.evaluate_business_lifecycle(ubid)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result