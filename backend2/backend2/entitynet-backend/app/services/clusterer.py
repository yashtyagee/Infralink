from sqlalchemy.orm import Session
from app.models.database import BusinessRecord, MatchLink, UBIDProfile, AuditLog
import networkx as nx
import uuid
from datetime import datetime


class Clusterer:
    def __init__(self, db: Session):
        self.db = db

    def assign_ubids(self):
        """
        Build clusters from AUTO_MERGE links using Union-Find on a graph,
        then upsert UBIDProfile records so no duplicate profiles are created
        for the same real-world business.
        """
        G = nx.Graph()

        # Add all records as nodes
        records = self.db.query(BusinessRecord).all()
        for record in records:
            G.add_node(record.id, record=record)

        # Add edges for AUTO_MERGE links only
        links = self.db.query(MatchLink).filter(MatchLink.decision == "AUTO_MERGE").all()
        for link in links:
            G.add_edge(link.record_1_id, link.record_2_id, score=link.similarity_score)

        # Find connected components — each component = one canonical business entity
        components = list(nx.connected_components(G))

        profiles = []
        for component in components:
            component_records = [
                self.db.query(BusinessRecord).get(node_id)
                for node_id in component
                if self.db.query(BusinessRecord).get(node_id) is not None
            ]
            if not component_records:
                continue

            # ── Determine anchor (prefer PAN > GST > NAME) ──────────────────
            anchor_type = "NAME"
            anchor_value = component_records[0].name

            for record in component_records:
                if record.pan:
                    anchor_type = "PAN"
                    anchor_value = record.pan
                    break
                elif record.gst and anchor_type != "PAN":
                    anchor_type = "GST"
                    anchor_value = record.gst

            # ── Canonical name = most frequent name in cluster ───────────────
            names = [r.name for r in component_records if r.name]
            canonical_name = max(set(names), key=names.count) if names else "Unknown"

            # ── Unique departments across all records in cluster ─────────────
            departments = list(set(
                r.source_department for r in component_records
                if r.source_department
            ))

            # ── Upsert: look for an existing profile sharing this anchor ─────
            existing_profile = None

            # First: check if any record in the cluster already has a UBID
            for rec in component_records:
                if rec.ubid:
                    existing_profile = self.db.query(UBIDProfile).filter(
                        UBIDProfile.ubid == rec.ubid
                    ).first()
                    if existing_profile:
                        break

            # Second: check by anchor identity (prevents dups across re-runs)
            if not existing_profile:
                existing_profile = self.db.query(UBIDProfile).filter(
                    UBIDProfile.anchor_type == anchor_type,
                    UBIDProfile.anchor_value == anchor_value
                ).first()

            if existing_profile:
                # ── UPDATE existing profile ──────────────────────────────────
                ubid = existing_profile.ubid

                # Merge in any new departments not previously recorded
                merged_depts = list(set(
                    (existing_profile.source_departments or []) + departments
                ))
                existing_profile.source_departments = merged_depts

                # Merge in any new record IDs
                merged_record_ids = list(set(
                    (existing_profile.record_ids or []) +
                    [r.id for r in component_records]
                ))
                existing_profile.record_ids = merged_record_ids
                existing_profile.canonical_name = canonical_name
                existing_profile.updated_at = datetime.utcnow()

                profile = existing_profile
            else:
                # ── CREATE new profile ───────────────────────────────────────
                ubid = f"KA-2024-{str(uuid.uuid4())[:8].upper()}"
                profile = UBIDProfile(
                    ubid=ubid,
                    canonical_name=canonical_name,
                    anchor_type=anchor_type,
                    anchor_value=anchor_value,
                    status="ACTIVE",
                    risk_score=0.0,
                    source_departments=departments,
                    record_ids=[r.id for r in component_records],
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                self.db.add(profile)

                # Audit log for new UBID
                audit = AuditLog(
                    entity_id=ubid,
                    action=f"UBID Assigned — cluster of {len(component_records)} records",
                    details={
                        "anchor_type": anchor_type,
                        "anchor_value": anchor_value,
                        "departments": departments,
                        "record_count": len(component_records)
                    },
                    actor="SYSTEM-CLUSTERER",
                    created_at=datetime.utcnow()
                )
                self.db.add(audit)

            # ── Stamp each record with the resolved UBID ─────────────────────
            for record in component_records:
                record.ubid = ubid

            profiles.append(profile)

        self.db.commit()
        return profiles