"""Superadmin router: user management, credit adjustments, verification logs."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from app.database import get_db
from app.models.user import User
from app.models.credit import CreditTransaction
from app.models.verification import VerificationResult, BulkVerificationJob
from app.schemas.user import UserListResponse, UserResponse
from app.schemas.credit import CreditAdjustRequest, CreditTransactionResponse
from app.schemas.verification import VerificationResultResponse, BulkJobResponse
from app.core.deps import get_superadmin
from app.services.credit_service import add_credits
import logging

router = APIRouter(prefix="/api/admin", tags=["Superadmin"])
logger = logging.getLogger(__name__)


@router.get("/users", response_model=list[UserListResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_superadmin),
):
    """List all users with their credit balances."""
    result = await db.execute(
        select(User).order_by(desc(User.created_at)).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_superadmin),
):
    """Get details of a specific user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}/activate")
async def toggle_user_active(
    user_id: str,
    active: bool,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_superadmin),
):
    """Activate or deactivate a user account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = active
    await db.commit()
    return {"message": f"User {'activated' if active else 'deactivated'} successfully"}


@router.post("/credits/adjust", response_model=CreditTransactionResponse)
async def adjust_user_credits(
    request: CreditAdjustRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_superadmin),
):
    """Add or deduct credits for any user (superadmin only)."""
    result = await db.execute(select(User).where(User.id == request.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if request.amount == 0:
        raise HTTPException(status_code=400, detail="Amount cannot be zero")

    if request.amount > 0:
        transaction = await add_credits(
            db=db,
            user=user,
            amount=request.amount,
            reason=request.reason or f"Manual adjustment by admin {admin.email}",
            source="admin",
        )
    else:
        # Deduct
        abs_amount = abs(request.amount)
        if user.credits < abs_amount:
            raise HTTPException(status_code=400, detail="User has insufficient credits to deduct")
        user.credits -= abs_amount
        from app.models.credit import CreditTransaction
        transaction = CreditTransaction(
            user_id=user.id,
            amount=request.amount,
            balance_after=user.credits,
            reason=request.reason or f"Manual deduction by admin {admin.email}",
            source="admin",
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)

    logger.info(f"Admin {admin.email} adjusted {request.amount} credits for user {user.email}")
    return transaction


@router.get("/credits/transactions", response_model=list[CreditTransactionResponse])
async def list_all_transactions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_superadmin),
):
    """List all credit transactions across all users."""
    result = await db.execute(
        select(CreditTransaction)
        .order_by(desc(CreditTransaction.created_at))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/verifications", response_model=list[VerificationResultResponse])
async def list_all_verifications(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_superadmin),
):
    """List all email verification logs across all users."""
    result = await db.execute(
        select(VerificationResult)
        .order_by(desc(VerificationResult.created_at))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/bulk-jobs", response_model=list[BulkJobResponse])
async def list_all_bulk_jobs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_superadmin),
):
    """List all bulk verification jobs across all users."""
    result = await db.execute(
        select(BulkVerificationJob)
        .order_by(desc(BulkVerificationJob.created_at))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/stats")
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_superadmin),
):
    """Get platform-wide statistics."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_verifications = (await db.execute(select(func.count(VerificationResult.id)))).scalar()
    total_credits = (await db.execute(select(func.sum(User.credits)))).scalar() or 0
    total_bulk_jobs = (await db.execute(select(func.count(BulkVerificationJob.id)))).scalar()

    return {
        "total_users": total_users,
        "total_verifications": total_verifications,
        "total_credits_outstanding": total_credits,
        "total_bulk_jobs": total_bulk_jobs,
    }
