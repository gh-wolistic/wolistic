from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import get_db_session
from app.models.expert_review_request import ExpertReviewRequest
from app.core.auth import AuthenticatedUser, get_optional_current_user
from app.schemas.intake import ExpertReviewResponse, ExpertReviewSubmission

router = APIRouter(prefix="/intake", tags=["intake"])
logger = logging.getLogger(__name__)


@router.post("/expert-review", response_model=ExpertReviewResponse, status_code=status.HTTP_201_CREATED)
async def submit_expert_review(
    payload: ExpertReviewSubmission,
    db: AsyncSession = Depends(get_db_session),
    current_user: AuthenticatedUser | None = Depends(get_optional_current_user),
) -> ExpertReviewResponse:
    try:
        request_record = ExpertReviewRequest(
            user_id=current_user.user_id if current_user else None,
            query=payload.query,
            scope=payload.scope,
            answers=payload.answers.model_dump(),
            status="received",
            source=payload.source or "expert_review_chat",
        )
        db.add(request_record)
        await db.commit()
        await db.refresh(request_record)
        logger.info(f"Expert review request created: {request_record.id}")
        return ExpertReviewResponse.model_validate(request_record)
    except SQLAlchemyError as exc:
        await db.rollback()
        logger.error(f"Database error saving expert review: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while saving expert review"
        ) from exc
    except Exception as exc:  # pragma: no cover - safety net
        await db.rollback()
        logger.error(f"Unexpected error saving expert review: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save expert review"
        ) from exc
