"""Redis caching utilities."""
import json
import hashlib
from typing import Optional, Any
import redis.asyncio as aioredis
from app.config import get_settings

settings = get_settings()

_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    """Get or create a Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def cache_key(prefix: str, value: str) -> str:
    """Generate a consistent cache key."""
    digest = hashlib.sha256(value.encode()).hexdigest()[:16]
    return f"{prefix}:{digest}"


async def get_cached(key: str) -> Optional[Any]:
    """Retrieve a value from cache."""
    try:
        client = await get_redis()
        value = await client.get(key)
        if value:
            return json.loads(value)
    except Exception:
        pass
    return None


async def set_cached(key: str, value: Any, ttl: int = None) -> None:
    """Store a value in cache."""
    try:
        client = await get_redis()
        ttl = ttl or settings.CACHE_TTL
        await client.setex(key, ttl, json.dumps(value))
    except Exception:
        pass


async def delete_cached(key: str) -> None:
    """Remove a value from cache."""
    try:
        client = await get_redis()
        await client.delete(key)
    except Exception:
        pass
