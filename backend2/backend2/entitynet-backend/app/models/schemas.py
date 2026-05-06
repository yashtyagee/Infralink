from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class BusinessRecordSchema(BaseModel):
    id: str
    name: str
    address: Optional[str]
    phone: Optional[str]
    pan: Optional[str]
    gst: Optional[str]
    source_department: str
    raw_data: Dict

class MatchLinkSchema(BaseModel):
    id: str
    record_1_id: str
    record_2_id: str
    similarity_score: float
    decision_reason: str
    matched_fields: Dict
    record1: Optional[BusinessRecordSchema]
    record2: Optional[BusinessRecordSchema]

class ReviewDecisionSchema(BaseModel):
    link_id: str
    record_1_id: Optional[str] = None
    record_2_id: Optional[str] = None
    decision: str  # APPROVE, REJECT, or DEFER


class UBIDProfileSchema(BaseModel):
    ubid: str
    canonical_name: str
    status: str
    anchor_type: str
    anchor_value: str
    source_departments: List[str]
    record_count: int

class AnalyticsQuerySchema(BaseModel):
    status: Optional[str]
    pincode: Optional[str]
    missing_event_type: Optional[str]
    missing_event_months: Optional[int]

class EventAttachSchema(BaseModel):
    event_id: str
    ubid: str