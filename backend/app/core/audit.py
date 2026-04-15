"""Audit logging functionality for admin actions."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from typing import Any


async def log_admin_action(
    *,
    action: str,
    resource_type: str,
    resource_id: str,
    admin_email: str,
    request: Request,
    db: AsyncSession,
    payload: dict[str, Any] | None = None,
) -> None:
    """
    Log an administrative action to the audit trail.
    
    This function creates an immutable audit log entry for compliance tracking.
    Should be called AFTER the main action succeeds (post-commit) to avoid
    phantom logs for failed operations.
    
    Args:
        action: Action performed (e.g., 'approve_professional', 'update_tier')
        resource_type: Type of resource affected (e.g., 'professional', 'offer')
        resource_id: ID of the affected resource (converted to string)
        admin_email: Email of admin who performed the action
        request: FastAPI request object (for IP, user agent, method, path)
        db: Database session (should be the same session used for main action)
        payload: Optional dict with action details (request body, parameters, etc.)
    
    Returns:
        None
    
    Raises:
        Does not raise - logs errors but allows main operation to succeed
    
    Example:
        ```python
        await log_admin_action(
            action="approve_professional",
            resource_type="professional",
            resource_id=str(user_id),
            admin_email=admin_email,
            request=request,
            db=db,
            payload={"status": "verified", "notes": "Manual approval"}
        )
        ```
    """
    from app.models.admin_audit import AdminAuditLog
    
    try:
        # Extract client IP (handle proxy headers if needed)
        client_ip = None
        if request.client:
            client_ip = request.client.host
        # Fallback to X-Forwarded-For if behind proxy
        if not client_ip and "x-forwarded-for" in request.headers:
            client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
        
        # Extract user agent
        user_agent = request.headers.get("user-agent")
        
        # Create audit log entry
        audit_entry = AdminAuditLog(
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),  # Ensure string for UUID compatibility
            admin_email=admin_email,
            request_method=request.method,
            request_path=str(request.url.path),
            payload=payload,
            client_ip=client_ip,
            user_agent=user_agent,
        )
        
        db.add(audit_entry)
        await db.commit()
        
    except Exception as e:
        # Log error but don't fail the main operation
        # In production, this should go to a monitoring service
        import logging
        logger = logging.getLogger(__name__)
        logger.error(
            f"Failed to create audit log entry: {e}",
            extra={
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "admin_email": admin_email,
            },
            exc_info=True,
        )
        # Rollback the audit log transaction but don't re-raise
        await db.rollback()
