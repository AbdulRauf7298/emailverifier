"""Verification schemas."""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class SingleVerifyRequest(BaseModel):
    email: EmailStr


class VerificationResultResponse(BaseModel):
    id: str
    email: str
    is_valid_syntax: bool
    has_mx_records: Optional[bool]
    is_smtp_valid: Optional[bool]
    is_disposable: bool
    is_role_based: bool
    is_catch_all: Optional[bool]
    deliverability_score: float
    status: str
    suggested_correction: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class BulkJobResponse(BaseModel):
    id: str
    filename: Optional[str]
    status: str
    total_emails: Optional[int]
    processed_emails: int
    valid_count: int
    invalid_count: int
    risky_count: int
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}
