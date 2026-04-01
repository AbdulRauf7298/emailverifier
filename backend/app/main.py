"""
EmailVerifier SaaS - FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import get_settings
from app.database import create_tables
from app.routers import auth, verification, credits, admin, webhook
from app.core.security import hash_password, generate_api_key

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown logic."""
    logger.info("Starting EmailVerifier SaaS backend...")
    await create_tables()
    await _create_superadmin()
    logger.info("Startup complete.")
    yield
    logger.info("Shutting down EmailVerifier SaaS backend.")


async def _create_superadmin():
    """Create the superadmin account if it doesn't exist."""
    from app.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.user import User

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == settings.SUPERADMIN_EMAIL))
        if not result.scalar_one_or_none():
            admin = User(
                email=settings.SUPERADMIN_EMAIL,
                hashed_password=hash_password(settings.SUPERADMIN_PASSWORD),
                full_name="Superadmin",
                is_superadmin=True,
                credits=settings.SUPERADMIN_INITIAL_CREDITS,
                api_key=generate_api_key(),
            )
            db.add(admin)
            await db.commit()
            logger.info(f"Superadmin account created: {settings.SUPERADMIN_EMAIL}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="SaaS Email Verification Platform with credit-based usage",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(verification.router)
app.include_router(credits.router)
app.include_router(admin.router)
app.include_router(webhook.router)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {"service": settings.APP_NAME, "version": settings.APP_VERSION, "status": "healthy"}


@app.get("/health", tags=["Health"])
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
