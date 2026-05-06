from sqlalchemy.orm import Session
from app.models.database import BusinessRecord, MatchLink
from app.services.siamese_model import SiameseMatcher
from fuzzywuzzy import fuzz
import uuid
from datetime import datetime
import re


def _normalize_name(name: str) -> str:
    """Normalize business name for better fuzzy matching."""
    if not name:
        return ""
    name = name.lower().strip()
    
    # Standardize domain terms
    name = re.sub(r'\bpharma\b', 'pharmaceuticals', name)
    name = re.sub(r'\belectronics?\b', 'electronics', name)
    name = re.sub(r'\btextiles?\b', 'textiles', name)
    name = re.sub(r'\bent\b\.?', 'enterprise', name)
    name = re.sub(r'\benterprizes?\b', 'enterprise', name)
    name = re.sub(r'\benterprises?\b', 'enterprise', name)
    
    # Universal Synonyms and Plurals
    name = re.sub(r'\bhotels?\b', 'hotel', name)
    name = re.sub(r'\bfoods?\b', 'food', name)
    name = re.sub(r'\bproducts?\b', 'product', name)
    name = re.sub(r'\bfarms?\b', 'farm', name)
    name = re.sub(r'\bsweets?\b', 'sweet', name)
    name = re.sub(r'\bparts?\b', 'part', name)
    name = re.sub(r'\btraders?\b', 'trading', name)
    name = re.sub(r'\binds?\b\.?', 'industry', name)
    name = re.sub(r'\bindustries\b', 'industry', name)

    # Strip common business suffixes / noise words that skew matching
    stopwords = [
        r'\bpvt\.?\s*ltd\.?', r'\bprivate\s+limited\b', r'\bltd\.?\b', r'\blimited\b',
        r'\bco\.?\b', r'\bcompany\b', r'\bworld\b', r'\bindia\b', r'\bcorp\b', r'\bcorporation\b'
    ]
    for pattern in stopwords:
        name = re.sub(pattern, '', name)

    # Remove extra whitespace and punctuation
    name = re.sub(r'[^\w\s]', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name


class EntityMatcher:
    def __init__(self, db: Session):
        self.db = db
        self.siamese = SiameseMatcher()

    def calculate_similarity(self, record1: BusinessRecord, record2: BusinessRecord):
        # 1. Hard Identifiers Check (PAN / GST)
        pan1 = record1.pan.strip().upper() if record1.pan else None
        pan2 = record2.pan.strip().upper() if record2.pan else None
        gst1 = record1.gst.strip().upper() if record1.gst else None
        gst2 = record2.gst.strip().upper() if record2.gst else None

        # Conflicting hard identifiers -> definitely NOT the same business
        if (pan1 and pan2 and pan1 != pan2) or (gst1 and gst2 and gst1 != gst2):
            return 0.10

        # Matching hard identifiers -> definitely the same business
        if (pan1 and pan2 and pan1 == pan2) or (gst1 and gst2 and gst1 == gst2):
            return 0.95

        # 2. Name Matching
        name1_raw = record1.name or ""
        name2_raw = record2.name or ""
        name1_norm = _normalize_name(name1_raw)
        name2_norm = _normalize_name(name2_raw)

        # Fuzzy match on both raw and normalized names, take best
        name_fuzzy_raw = fuzz.token_sort_ratio(name1_raw.lower(), name2_raw.lower()) / 100.0
        name_fuzzy_norm = fuzz.token_sort_ratio(name1_norm, name2_norm) / 100.0
        name_sim = max(name_fuzzy_raw, name_fuzzy_norm)

        # Siamese model on normalized names
        name_siamese_sim = self.siamese.predict_similarity(name1_norm, name2_norm)

        # Blended name score
        overall_name_sim = (name_sim * 0.4) + (name_siamese_sim * 0.6)

        # 3. Address Matching
        addr1 = record1.address or ""
        addr2 = record2.address or ""
        has_addr1 = len(addr1.strip()) > 5
        has_addr2 = len(addr2.strip()) > 5

        # If we have both addresses, incorporate into score
        if has_addr1 and has_addr2:
            address_sim = fuzz.token_sort_ratio(addr1.lower(), addr2.lower()) / 100.0
            # Name matters more than address, but address confirms
            final_score = (overall_name_sim * 0.65) + (address_sim * 0.35)
        else:
            # If address is missing, rely entirely on the name
            final_score = overall_name_sim

        return final_score

    def run_matching(self):
        records = self.db.query(BusinessRecord).all()
        links = []
        auto_merged = 0
        pending_review = 0

        for i in range(len(records)):
            for j in range(i + 1, len(records)):
                # Skip if already linked AND it's not a SKIPPED link
                # (We want to recalculate SKIPPED links with the new, improved logic)
                existing = self.db.query(MatchLink).filter(
                    ((MatchLink.record_1_id == records[i].id) & (MatchLink.record_2_id == records[j].id)) |
                    ((MatchLink.record_1_id == records[j].id) & (MatchLink.record_2_id == records[i].id))
                ).first()

                if existing and existing.decision != "SKIPPED":
                    continue

                score = self.calculate_similarity(records[i], records[j])

                # Lowered AUTO_MERGE threshold: 0.70
                # This catches name variations like "Rajesh Ent." vs "Rajesh Enterprises"
                if score >= 0.70:
                    decision = "AUTO_MERGE"
                    auto_merged += 1
                elif score >= 0.45:
                    decision = "PENDING_REVIEW"
                    pending_review += 1
                else:
                    decision = "SKIPPED"
                    if existing:
                        continue # Leave existing skipped as is
                    
                name1_norm = _normalize_name(records[i].name)
                name2_norm = _normalize_name(records[j].name)

                if existing:
                    # Update existing skipped link if it got promoted
                    existing.similarity_score = score
                    existing.decision = decision
                    existing.decision_reason = f"Matched with score {score:.2f} (name: {name1_norm} ↔ {name2_norm})"
                else:
                    link = MatchLink(
                        id=str(uuid.uuid4()),
                        record_1_id=records[i].id,
                        record_2_id=records[j].id,
                        similarity_score=score,
                        decision=decision,
                        decision_reason=f"Matched with score {score:.2f} (name: {name1_norm} ↔ {name2_norm})",
                        matched_fields={
                            "fields": ["name", "address"],
                            "breakdown": {
                                "name_normalized": name1_norm,
                                "score": round(score * 100, 1)
                            }
                        }
                    )
                    self.db.add(link)
                    links.append(link)

        self.db.commit()

        return {
            "autoMerged": auto_merged,
            "pendingReview": pending_review,
            "skipped": len(records) * (len(records) - 1) // 2 - (auto_merged + pending_review),
            "total": len(records)
        }