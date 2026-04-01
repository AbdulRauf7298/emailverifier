"""Email verification router: single and bulk verification."""
import csv
import io
import uuid
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models.user import User
from app.models.verification import VerificationResult, BulkVerificationJob
from app.schemas.verification import SingleVerifyRequest, VerificationResultResponse, BulkJobResponse
from app.core.deps import get_current_user
from app.services.email_verifier import verify_email
from app.services.credit_service import deduct_credits
from app.core.cache import get_cached, set_cached, cache_key
from app.config import get_settings
import logging

router = APIRouter(prefix="/api/verify", tags=["Verification"])
logger = logging.getLogger(__name__)
settings = get_settings()


@router.post("/single", response_model=VerificationResultResponse)
async def verify_single_email(
    request: SingleVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify a single email address. Consumes 1 credit."""
    email = request.email.strip().lower()

    # Check cache first
    ck = cache_key("verify", email)
    cached = await get_cached(ck)

    if not cached:
        # Deduct credit
        await deduct_credits(db, current_user, settings.CREDITS_PER_VERIFICATION, "single_verification")

        # Perform verification
        result_data = await verify_email(email)

        # Store result
        verification = VerificationResult(
            user_id=current_user.id,
            **result_data,
        )
        db.add(verification)
        await db.commit()
        await db.refresh(verification)

        # Cache the result
        await set_cached(ck, {
            "email": verification.email,
            "is_valid_syntax": verification.is_valid_syntax,
            "has_mx_records": verification.has_mx_records,
            "is_smtp_valid": verification.is_smtp_valid,
            "is_disposable": verification.is_disposable,
            "is_role_based": verification.is_role_based,
            "is_catch_all": verification.is_catch_all,
            "deliverability_score": verification.deliverability_score,
            "status": verification.status,
            "suggested_correction": verification.suggested_correction,
        })
        return verification
    else:
        # Return cached result but still deduct credits and log
        await deduct_credits(db, current_user, settings.CREDITS_PER_VERIFICATION, "single_verification")

        verification = VerificationResult(
            user_id=current_user.id,
            email=cached["email"],
            is_valid_syntax=cached["is_valid_syntax"],
            has_mx_records=cached.get("has_mx_records"),
            is_smtp_valid=cached.get("is_smtp_valid"),
            is_disposable=cached["is_disposable"],
            is_role_based=cached["is_role_based"],
            is_catch_all=cached.get("is_catch_all"),
            deliverability_score=cached["deliverability_score"],
            status=cached["status"],
            suggested_correction=cached.get("suggested_correction"),
        )
        db.add(verification)
        await db.commit()
        await db.refresh(verification)
        return verification


@router.post("/bulk", response_model=BulkJobResponse, status_code=202)
async def verify_bulk_emails(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a CSV file for bulk email verification (async processing)."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.reader(io.StringIO(decoded))
    emails = []
    for row in reader:
        if row:
            email = row[0].strip()
            if email and email.lower() != "email":  # skip header
                emails.append(email)

    if not emails:
        raise HTTPException(status_code=400, detail="No emails found in CSV")

    if len(emails) > 10000:
        raise HTTPException(status_code=400, detail="Maximum 10,000 emails per bulk job")

    # Check credits
    if current_user.credits < len(emails):
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient credits. Need {len(emails)}, have {current_user.credits}",
        )

    # Create job
    job = BulkVerificationJob(
        user_id=current_user.id,
        filename=file.filename,
        status="pending",
        total_emails=len(emails),
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Schedule background processing
    background_tasks.add_task(
        _process_bulk_job,
        job_id=job.id,
        emails=emails,
        user_id=current_user.id,
    )

    return job


@router.get("/bulk/{job_id}", response_model=BulkJobResponse)
async def get_bulk_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the status and results of a bulk verification job."""
    result = await db.execute(
        select(BulkVerificationJob).where(
            BulkVerificationJob.id == job_id,
            BulkVerificationJob.user_id == current_user.id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/bulk/{job_id}/results", response_model=list[VerificationResultResponse])
async def get_bulk_job_results(
    job_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the individual results for a bulk verification job."""
    job_check = await db.execute(
        select(BulkVerificationJob.id).where(
            BulkVerificationJob.id == job_id,
            BulkVerificationJob.user_id == current_user.id,
        )
    )
    if not job_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Job not found")

    result = await db.execute(
        select(VerificationResult)
        .where(VerificationResult.bulk_job_id == job_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/history", response_model=list[VerificationResultResponse])
async def get_verification_history(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's email verification history."""
    result = await db.execute(
        select(VerificationResult)
        .where(VerificationResult.user_id == current_user.id)
        .order_by(desc(VerificationResult.created_at))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def _process_bulk_job(job_id: str, emails: list[str], user_id: str):
    """Background task: process a bulk email verification job."""
    from app.database import AsyncSessionLocal
    from app.models.credit import CreditTransaction

    async with AsyncSessionLocal() as db:
        try:
            # Load job and user
            job_result = await db.execute(select(BulkVerificationJob).where(BulkVerificationJob.id == job_id))
            job = job_result.scalar_one_or_none()
            if not job:
                return

            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            if not user:
                return

            job.status = "processing"
            await db.commit()

            valid_count = invalid_count = risky_count = 0
            processed = 0
            credits_to_deduct = 0

            for email in emails:
                try:
                    ck = cache_key("verify", email.strip().lower())
                    result_data = await get_cached(ck)

                    if not result_data:
                        result_data = await verify_email(email)
                        await set_cached(ck, {k: v for k, v in result_data.items()})

                    verification = VerificationResult(
                        user_id=user_id,
                        bulk_job_id=job_id,
                        **result_data,
                    )
                    db.add(verification)
                    credits_to_deduct += 1

                    if result_data["status"] == "valid":
                        valid_count += 1
                    elif result_data["status"] == "invalid":
                        invalid_count += 1
                    else:
                        risky_count += 1

                    processed += 1

                    # Commit in batches of 50
                    if processed % 50 == 0:
                        job.processed_emails = processed
                        job.valid_count = valid_count
                        job.invalid_count = invalid_count
                        job.risky_count = risky_count
                        await db.commit()

                except Exception as e:
                    logger.error(f"Error verifying {email}: {e}")
                    processed += 1

            # Deduct all credits at once
            if credits_to_deduct > 0 and user.credits >= credits_to_deduct:
                user.credits -= credits_to_deduct
                transaction = CreditTransaction(
                    user_id=user_id,
                    amount=-credits_to_deduct,
                    balance_after=user.credits,
                    reason=f"Bulk verification job {job_id}",
                    source="verification",
                )
                db.add(transaction)

            job.status = "completed"
            job.processed_emails = processed
            job.valid_count = valid_count
            job.invalid_count = invalid_count
            job.risky_count = risky_count
            job.completed_at = datetime.now(timezone.utc)
            await db.commit()

        except Exception as e:
            logger.error(f"Bulk job {job_id} failed: {e}")
            try:
                job.status = "failed"
                job.error_message = str(e)
                await db.commit()
            except Exception:
                pass
