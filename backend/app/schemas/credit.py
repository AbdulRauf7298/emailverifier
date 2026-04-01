"""Credit schemas."""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class CreditAdjustRequest(BaseModel):
    user_id: str
    amount: int = Field(..., description="Positive to add, negative to deduct")
    reason: Optional[str] = None


class CreditTransactionResponse(BaseModel):
    id: str
    user_id: str
    amount: int
    balance_after: int
    reason: Optional[str]
    source: Optional[str]
    woocommerce_order_id: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class WooCommerceWebhookPayload(BaseModel):
    id: int
    status: str
    billing: dict
    line_items: list[dict]
    meta_data: Optional[list[dict]] = None
