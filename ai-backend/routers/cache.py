"""
Cache Management Router

Endpoints for monitoring and managing the cache
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/cache", tags=["cache"])

class CacheInvalidateRequest(BaseModel):
    query: Optional[str] = None
    intent: Optional[str] = None
    clear_all: bool = False

@router.get("/stats")
async def get_cache_stats():
    """
    Get cache statistics
    
    Returns:
    - hits: Number of cache hits
    - misses: Number of cache misses
    - total_requests: Total cache requests
    - hit_rate: Cache hit percentage
    - cache_size: Number of entries in cache
    """
    from graph import response_cache
    
    stats = response_cache.get_stats()
    
    return {
        "status": "success",
        "cache_stats": stats,
        "message": f"Cache hit rate: {stats['hit_rate']}"
    }

@router.post("/invalidate")
async def invalidate_cache(request: CacheInvalidateRequest):
    """
    Invalidate cache entries
    
    Options:
    - clear_all: Clear entire cache
    - query + intent: Invalidate specific entry
    """
    from graph import response_cache
    
    if request.clear_all:
        response_cache.invalidate()
        return {
            "status": "success",
            "message": "All cache entries cleared",
            "action": "clear_all"
        }
    elif request.query:
        response_cache.invalidate(query=request.query, intent=request.intent)
        return {
            "status": "success",
            "message": f"Cache invalidated for query: {request.query[:50]}...",
            "action": "invalidate_query"
        }
    else:
        return {
            "status": "error",
            "message": "Must provide either clear_all=true or query parameter"
        }

@router.post("/cleanup")
async def cleanup_expired():
    """
    Manually trigger cleanup of expired cache entries
    """
    from graph import response_cache
    
    response_cache.cleanup_expired()
    stats = response_cache.get_stats()
    
    return {
        "status": "success",
        "message": "Expired entries cleaned up",
        "current_cache_size": stats["cache_size"]
    }

@router.get("/health")
async def cache_health():
    """
    Check cache health status
    """
    from graph import response_cache
    
    stats = response_cache.get_stats()
    
    # Determine health status
    hit_rate_numeric = float(stats['hit_rate'].rstrip('%'))
    
    if hit_rate_numeric >= 50:
        health = "excellent"
    elif hit_rate_numeric >= 30:
        health = "good"
    elif hit_rate_numeric >= 10:
        health = "fair"
    else:
        health = "poor"
    
    return {
        "status": "healthy",
        "cache_health": health,
        "statistics": stats,
        "recommendations": {
            "excellent": "Cache is performing optimally",
            "good": "Cache is working well",
            "fair": "Consider increasing TTL or reviewing query patterns",
            "poor": "Review caching strategy - many cache misses"
        }.get(health, "")
    }