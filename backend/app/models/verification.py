"""Email verification result and bulk job models."""
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, Float, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class VerificationResult(Base):
    __tablename__ = "verification_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    is_valid_syntax: Mapped[bool] = mapped_column(Boolean, nullable=False)
    has_mx_records: Mapped[bool] = mapped_column(Boolean, nullable=True)
    is_smtp_valid: Mapped[bool] = mapped_column(Boolean, nullable=True)
    is_disposable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_role_based: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_catch_all: Mapped[bool] = mapped_column(Boolean, nullable=True)
    deliverability_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(String(32), nullable=False)  # valid, invalid, risky, unknown
    suggested_correction: Mapped[str] = mapped_column(String(255), nullable=True)
    bulk_job_id: Mapped[str] = mapped_column(String(36), ForeignKey("bulk_verification_jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="verifications")
    bulk_job: Mapped["BulkVerificationJob"] = relationship("BulkVerificationJob", back_populates="results")


class BulkVerificationJob(Base):
    __tablename__ = "bulk_verification_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")  # pending, processing, completed, failed
    total_emails: Mapped[int] = mapped_column(Integer, nullable=True)
    processed_emails: Mapped[int] = mapped_column(Integer, default=0)
    valid_count: Mapped[int] = mapped_column(Integer, default=0)
    invalid_count: Mapped[int] = mapped_column(Integer, default=0)
    risky_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="bulk_jobs")
    results: Mapped[list["VerificationResult"]] = relationship("VerificationResult", back_populates="bulk_job")
