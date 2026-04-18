"""
Supabase client initialization and dependency injection for FastAPI.
"""
from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def _get_supabase_service_client() -> Client:
    """
    Get a cached Supabase client with service_role key.
    
    Used for server-side operations that bypass RLS.
    For user-authenticated operations, use the user's JWT token instead.
    """
    settings = get_settings()
    
    return create_client(
        supabase_url=str(settings.SUPABASE_URL),
        supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY,
    )


def get_supabase_client() -> Client:
    """
    FastAPI dependency for injecting Supabase client.
    
    Usage:
        @router.get("/")
        async def my_route(supabase: Client = Depends(get_supabase_client)):
            ...
    """
    return _get_supabase_service_client()
