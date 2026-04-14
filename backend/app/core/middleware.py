"""
Request middleware for tracing and observability.
"""

import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Add unique request ID to all requests for tracing.
    
    - Accepts X-Request-ID from client if provided
    - Generates UUID if not provided
    - Adds to request.state for use in logging
    - Returns in response headers for client-side debugging
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Use client-provided request ID or generate new one
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        
        # Store in request state for access in route handlers and logging
        request.state.request_id = request_id
        
        # Process request
        response = await call_next(request)
        
        # Add to response headers for client-side correlation
        response.headers["X-Request-ID"] = request_id
        
        return response
