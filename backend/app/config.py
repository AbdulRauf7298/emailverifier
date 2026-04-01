"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings
from functools import lru_cache


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

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Superadmin
    SUPERADMIN_EMAIL: str = "admin@emailverifier.com"
    SUPERADMIN_PASSWORD: str = "ChangeMe123!"
    SUPERADMIN_INITIAL_CREDITS: int = 999999

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
