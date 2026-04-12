from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.client import ExpertClient, ExpertClientFollowUp, ExpertLead
from app.models.professional import Professional
from app.schemas.client import (
    ClientsBoardOut,
    ExpertClientIn,
    ExpertClientOut,
    ExpertClientUpdateIn,
    ExpertFollowUpIn,
    ExpertFollowUpOut,
    ExpertFollowUpUpdateIn,
    ExpertLeadIn,
    ExpertLeadOut,
    ExpertLeadUpdateIn,
)

router = APIRouter(prefix="/partners", tags=["clients"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _initials(name: str) -> str:
    parts = name.strip().split()
    return "".join(p[0].upper() for p in parts[:2]) or "??"


async def _require_professional(
    current_user: AuthenticatedUser,
    db: AsyncSession,
) -> Professional:
    result = await db.execute(
        select(Professional).where(Professional.user_id == current_user.user_id)
    )
    professional = result.scalar_one_or_none()
    if professional is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Professional profile not found")
    return professional


async def _build_followup_out(f: ExpertClientFollowUp, db: AsyncSession) -> ExpertFollowUpOut:
    client_result = await db.execute(
        select(ExpertClient).where(ExpertClient.id == f.client_id)
    )
    client = client_result.scalar_one_or_none()
    return ExpertFollowUpOut(
        id=f.id,
        client_id=f.client_id,
        client_name=client.name if client else "Unknown",
        client_initials=_initials(client.name) if client else "??",
        last_session_date=client.last_session_date if client else None,
        note=f.note,
        due_date=f.due_date,
        resolved=f.resolved,
        created_at=f.created_at,
    )


# ── Board (all three lists in one call) ───────────────────────────────────────

@router.get("/me/clients-board", response_model=ClientsBoardOut)
async def get_clients_board(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ClientsBoardOut:
    professional = await _require_professional(current_user, db)

    clients_result = await db.execute(
        select(ExpertClient)
        .where(ExpertClient.professional_id == professional.user_id)
        .order_by(ExpertClient.created_at.desc())
    )
    clients = clients_result.scalars().all()

    followups_result = await db.execute(
        select(ExpertClientFollowUp)
        .where(ExpertClientFollowUp.professional_id == professional.user_id)
        .order_by(ExpertClientFollowUp.due_date.asc())
    )
    followups_raw = followups_result.scalars().all()

    leads_result = await db.execute(
        select(ExpertLead)
        .where(ExpertLead.professional_id == professional.user_id)
        .order_by(ExpertLead.created_at.desc())
    )
    leads = leads_result.scalars().all()

    followups_out: list[ExpertFollowUpOut] = []
    for f in followups_raw:
        client_match = next((c for c in clients if c.id == f.client_id), None)
        followups_out.append(ExpertFollowUpOut(
            id=f.id,
            client_id=f.client_id,
            client_name=client_match.name if client_match else "Unknown",
            client_initials=_initials(client_match.name) if client_match else "??",
            last_session_date=client_match.last_session_date if client_match else None,
            note=f.note,
            due_date=f.due_date,
            resolved=f.resolved,
            created_at=f.created_at,
        ))

    return ClientsBoardOut(
        clients=[ExpertClientOut.model_validate(c) for c in clients],
        follow_ups=followups_out,
        leads=[ExpertLeadOut.model_validate(l) for l in leads],
    )


# ── Clients CRUD ──────────────────────────────────────────────────────────────

@router.post("/me/clients", response_model=ExpertClientOut, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ExpertClientIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ExpertClientOut:
    professional = await _require_professional(current_user, db)
    client = ExpertClient(
        professional_id=professional.user_id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        notes=payload.notes,
        status=payload.status,
        package_name=payload.package_name,
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return ExpertClientOut.model_validate(client)


@router.patch("/me/clients/{client_id}", response_model=ExpertClientOut)
async def update_client(
    client_id: int,
    payload: ExpertClientUpdateIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ExpertClientOut:
    professional = await _require_professional(current_user, db)
    result = await db.execute(
        select(ExpertClient).where(
            ExpertClient.id == client_id,
            ExpertClient.professional_id == professional.user_id,
        )
    )
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    await db.commit()
    await db.refresh(client)
    return ExpertClientOut.model_validate(client)


@router.delete("/me/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    professional = await _require_professional(current_user, db)
    result = await db.execute(
        select(ExpertClient).where(
            ExpertClient.id == client_id,
            ExpertClient.professional_id == professional.user_id,
        )
    )
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    await db.delete(client)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Follow-ups CRUD ───────────────────────────────────────────────────────────

@router.post("/me/followups", response_model=ExpertFollowUpOut, status_code=status.HTTP_201_CREATED)
async def create_followup(
    payload: ExpertFollowUpIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ExpertFollowUpOut:
    professional = await _require_professional(current_user, db)

    # Verify client belongs to this professional
    client_result = await db.execute(
        select(ExpertClient).where(
            ExpertClient.id == payload.client_id,
            ExpertClient.professional_id == professional.user_id,
        )
    )
    client = client_result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    followup = ExpertClientFollowUp(
        professional_id=professional.user_id,
        client_id=payload.client_id,
        note=payload.note,
        due_date=payload.due_date,
    )
    db.add(followup)
    await db.commit()
    await db.refresh(followup)
    return await _build_followup_out(followup, db)


@router.patch("/me/followups/{followup_id}", response_model=ExpertFollowUpOut)
async def update_followup(
    followup_id: int,
    payload: ExpertFollowUpUpdateIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ExpertFollowUpOut:
    professional = await _require_professional(current_user, db)
    result = await db.execute(
        select(ExpertClientFollowUp).where(
            ExpertClientFollowUp.id == followup_id,
            ExpertClientFollowUp.professional_id == professional.user_id,
        )
    )
    followup = result.scalar_one_or_none()
    if followup is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(followup, field, value)

    await db.commit()
    await db.refresh(followup)
    return await _build_followup_out(followup, db)


@router.delete("/me/followups/{followup_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_followup(
    followup_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    professional = await _require_professional(current_user, db)
    result = await db.execute(
        select(ExpertClientFollowUp).where(
            ExpertClientFollowUp.id == followup_id,
            ExpertClientFollowUp.professional_id == professional.user_id,
        )
    )
    followup = result.scalar_one_or_none()
    if followup is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up not found")
    await db.delete(followup)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Leads CRUD ────────────────────────────────────────────────────────────────

@router.post("/me/leads", response_model=ExpertLeadOut, status_code=status.HTTP_201_CREATED)
async def create_lead(
    payload: ExpertLeadIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ExpertLeadOut:
    professional = await _require_professional(current_user, db)
    lead = ExpertLead(
        professional_id=professional.user_id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        source=payload.source,
        interest=payload.interest,
        status=payload.status,
        enquiry_date=payload.enquiry_date or datetime.utcnow(),
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return ExpertLeadOut.model_validate(lead)


@router.patch("/me/leads/{lead_id}", response_model=ExpertLeadOut)
async def update_lead(
    lead_id: int,
    payload: ExpertLeadUpdateIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ExpertLeadOut:
    professional = await _require_professional(current_user, db)
    result = await db.execute(
        select(ExpertLead).where(
            ExpertLead.id == lead_id,
            ExpertLead.professional_id == professional.user_id,
        )
    )
    lead = result.scalar_one_or_none()
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)

    await db.commit()
    await db.refresh(lead)
    return ExpertLeadOut.model_validate(lead)


@router.delete("/me/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    professional = await _require_professional(current_user, db)
    result = await db.execute(
        select(ExpertLead).where(
            ExpertLead.id == lead_id,
            ExpertLead.professional_id == professional.user_id,
        )
    )
    lead = result.scalar_one_or_none()
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    await db.delete(lead)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Convert lead → client ─────────────────────────────────────────────────────

@router.post("/me/leads/{lead_id}/convert", response_model=ExpertClientOut)
async def convert_lead_to_client(
    lead_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ExpertClientOut:
    professional = await _require_professional(current_user, db)
    result = await db.execute(
        select(ExpertLead).where(
            ExpertLead.id == lead_id,
            ExpertLead.professional_id == professional.user_id,
        )
    )
    lead = result.scalar_one_or_none()
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    client = ExpertClient(
        professional_id=professional.user_id,
        name=lead.name,
        email=lead.email,
        phone=lead.phone,
        notes=lead.interest,
        status="active",
    )
    db.add(client)
    lead.status = "converted"
    await db.commit()
    await db.refresh(client)
    return ExpertClientOut.model_validate(client)
