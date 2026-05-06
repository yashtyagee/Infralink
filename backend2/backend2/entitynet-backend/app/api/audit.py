from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db, AuditLog

router = APIRouter()

@router.get("/api/audit/{entity_id}")
async def get_audit_trail(entity_id: str, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).filter(AuditLog.entity_id == entity_id).order_by(AuditLog.created_at.desc()).all()
    
    return [{
        "action": log.action,
        "details": log.details,
        "actor": log.actor,
        "created_at": log.created_at.isoformat()
    } for log in logs]