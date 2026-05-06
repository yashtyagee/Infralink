from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.services.matcher import EntityMatcher

router = APIRouter()

@router.post("/api/match")
async def run_matching(db: Session = Depends(get_db)):
    matcher = EntityMatcher(db)
    result = matcher.run_matching()
    
    return {
        "message": "Matching complete",
        "data": result
    }