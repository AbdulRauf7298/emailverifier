"""Credit management service."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User
from app.models.credit import CreditTransaction


async def get_user_credits(db: AsyncSession, user_id: str) -> int:
    """Return the current credit balance for a user."""
    result = await db.execute(select(User.credits).where(User.id == user_id))
    credits = result.scalar_one_or_none()
    if credits is None:
        raise HTTPException(status_code=404, detail="User not found")
    return credits


async def deduct_credits(
    db: AsyncSession,
    user: User,
    amount: int,
    reason: str = "email_verification",
) -> CreditTransaction:
    """
    Deduct credits from a user. Raises 402 if insufficient.
    Returns the created transaction.
    """
    if user.credits < amount:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient credits. Required: {amount}, Available: {user.credits}",
        )
    user.credits -= amount
    balance_after = user.credits

    transaction = CreditTransaction(
        user_id=user.id,
        amount=-amount,
        balance_after=balance_after,
        reason=reason,
        source="verification",
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(user)
    return transaction


async def add_credits(
    db: AsyncSession,
    user: User,
    amount: int,
    reason: str = "manual_adjustment",
    source: str = "admin",
    woocommerce_order_id: str = None,
) -> CreditTransaction:
    """Add credits to a user and record the transaction."""
    user.credits += amount
    balance_after = user.credits

    transaction = CreditTransaction(
        user_id=user.id,
        amount=amount,
        balance_after=balance_after,
        reason=reason,
        source=source,
        woocommerce_order_id=woocommerce_order_id,
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(user)
    return transaction
