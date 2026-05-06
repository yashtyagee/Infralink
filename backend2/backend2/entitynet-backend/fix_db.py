from app.models.database import SessionLocal, MatchLink
import json

db = SessionLocal()
links = db.query(MatchLink).all()
for link in links:
    if isinstance(link.matched_fields, dict) and "fields" not in link.matched_fields:
        link.matched_fields = {
            "fields": ["name", "address"],
            "breakdown": link.matched_fields
        }
db.commit()
db.close()
print("Fixed DB schema")
