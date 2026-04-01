"""Credits router: balance, transactions, and user credit management."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.user import User
from app.models.credit import CreditTransaction
from app.schemas.credit import CreditTransactionResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/credits", tags=["Credits"])


@router.get("/balance")
async def get_credit_balance(current_user: User = Depends(get_current_user)):
    """Return the current user's credit balance."""
    return {"user_id": current_user.id, "credits": current_user.credits}


@router.get("/transactions", response_model=list[CreditTransactionResponse])
async def get_credit_transactions(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the current user's credit transaction history."""
    result = await db.execute(
        select(CreditTransaction)
        .where(CreditTransaction.user_id == current_user.id)
        .order_by(desc(CreditTransaction.created_at))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
