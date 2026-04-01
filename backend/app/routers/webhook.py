"""WooCommerce webhook router for credit top-up on purchase."""
import base64
import hmac
import hashlib
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.services.credit_service import add_credits
from app.config import get_settings

router = APIRouter(prefix="/api/webhook", tags=["Webhooks"])
logger = logging.getLogger(__name__)
settings = get_settings()

# Mapping of WooCommerce product names/SKUs to credit amounts
CREDIT_PACK_MAP = {
    "credit-pack-100": 100,
    "credit-pack-500": 500,
    "credit-pack-1000": 1000,
    "credit-pack-5000": 5000,
    "starter-pack": 100,
    "pro-pack": 500,
    "business-pack": 1000,
    "enterprise-pack": 5000,
}


def _verify_woocommerce_signature(request_body: bytes, signature: str) -> bool:
    """Verify the WooCommerce webhook HMAC-SHA256 signature."""
    expected = hmac.new(
        settings.WOOCOMMERCE_WEBHOOK_SECRET.encode(),
        request_body,
        hashlib.sha256,
    ).digest()
    expected_b64 = base64.b64encode(expected).decode()
    return hmac.compare_digest(expected_b64, signature)


@router.post("/woocommerce/order-completed")
async def woocommerce_order_completed(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle WooCommerce 'order.completed' webhook.
    Automatically tops up user credits based on purchased products.
    """
    body = await request.body()
    signature = request.headers.get("X-WC-Webhook-Signature", "")

    if not signature or not _verify_woocommerce_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    order_id = str(payload.get("id", ""))
    order_status = payload.get("status", "")

    if order_status not in ("completed", "processing"):
        logger.info(f"Skipping WooCommerce order {order_id} with status {order_status}")
        return {"message": "Order status not actionable"}

    # Find user by billing email
    billing = payload.get("billing", {})
    customer_email = billing.get("email", "").lower().strip()

    if not customer_email:
        # Try meta_data for user email
        for meta in payload.get("meta_data", []):
            if meta.get("key") == "_customer_email":
                customer_email = meta.get("value", "").lower().strip()

    if not customer_email:
        raise HTTPException(status_code=400, detail="No customer email in payload")

    result = await db.execute(select(User).where(User.email == customer_email))
    user = result.scalar_one_or_none()

    if not user:
        logger.warning(f"WooCommerce webhook: No user found for order {order_id}")
        return {"message": "User not found, credits not applied"}

    # Calculate credits from line items
    total_credits = 0
    for item in payload.get("line_items", []):
        sku = item.get("sku", "").lower().strip()
        product_name = item.get("name", "").lower().strip()
        quantity = item.get("quantity", 1)

        credits_per_unit = (
            CREDIT_PACK_MAP.get(sku) or
            CREDIT_PACK_MAP.get(product_name) or
            _extract_credits_from_meta(item.get("meta_data", []))
        )
        if credits_per_unit:
            total_credits += credits_per_unit * quantity

    if total_credits == 0:
        logger.warning(f"Order {order_id}: Could not determine credits for items")
        return {"message": "No credit items found in order"}

    await add_credits(
        db=db,
        user=user,
        amount=total_credits,
        reason=f"WooCommerce order #{order_id}",
        source="woocommerce",
        woocommerce_order_id=order_id,
    )

    logger.info(f"Added {total_credits} credits to user (order {order_id})")
    return {"message": f"Added {total_credits} credits to {customer_email}"}


def _extract_credits_from_meta(meta_data: list) -> int:
    """Extract credit amount from WooCommerce item meta data."""
    for meta in meta_data:
        if meta.get("key") in ("credits", "_credits", "email_credits"):
            try:
                return int(meta.get("value", 0))
            except (ValueError, TypeError):
                pass
    return 0
