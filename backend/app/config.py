"""Application configuration loaded from environment variables."""
import logging
from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # App
    APP_NAME: str = "EmailVerifier SaaS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/emailverifier"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 3600  # seconds

    # WooCommerce webhook
    WOOCOMMERCE_WEBHOOK_SECRET: str = "wc-webhook-secret"

    # Credits
    CREDITS_PER_VERIFICATION: int = 1
    DEFAULT_USER_CREDITS: int = 10  # free credits on signup

    # Bulk verification limits
    MAX_BULK_EMAILS: int = 10000
    BULK_COMMIT_BATCH_SIZE: int = 50

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Superadmin
    SUPERADMIN_EMAIL: str = "admin@emailverifier.com"
    SUPERADMIN_PASSWORD: str = "ChangeMe123!"
    SUPERADMIN_INITIAL_CREDITS: int = 999999

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

    @model_validator(mode="after")
    def warn_insecure_defaults(self) -> "Settings":
        if not self.DEBUG:
            if self.SECRET_KEY == "change-me-in-production":
                logger.warning("SECRET_KEY is using an insecure default value. Set a strong SECRET_KEY in production.")
            if self.SUPERADMIN_PASSWORD == "ChangeMe123!":
                logger.warning("SUPERADMIN_PASSWORD is using the default value. Change it in production.")
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()
