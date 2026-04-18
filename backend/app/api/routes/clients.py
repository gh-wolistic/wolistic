from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.client import (
    ExpertClient,
    ExpertClientFollowUp,
    ExpertClientRoutine,
    ExpertClientRoutineItem,
    ExpertLead,
)
from app.models.professional import Professional
from app.services import notification as notification_service
from app.schemas.client import (
    ClientsBoardOut,
    DashboardMetricsOut,
    ExpertClientIn,
    ExpertClientOut,
    ExpertClientUpdateIn,
    ExpertFollowUpIn,
    ExpertFollowUpOut,
    ExpertFollowUpUpdateIn,
    ExpertLeadIn,
    ExpertLeadOut,
    ExpertLeadUpdateIn,
    RoutineIn,
    RoutineItemIn,
    RoutineItemOut,
    RoutineItemUpdateIn,
    RoutineOut,
    RoutineUpdateIn,
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
    
    # Schedule reminder notification for due date
    from datetime import timezone
    now = datetime.now(timezone.utc)
    days_until_due = (payload.due_date - now).days
    
    if days_until_due <= 1:  # Due today or tomorrow
        when = "today" if days_until_due == 0 else "tomorrow"
        await notification_service.create_notification(
            db,
            user_id=professional.user_id,
            type="followup",
            title=f"📋 Follow-up Due {when.title()}",
            description=f"Reminder: {client.name} - {payload.note[:100] if payload.note else 'Follow-up scheduled'}",
            action_url="/v2/partner/body-expert/clients",
            action_text="View Follow-ups",
            extra_data={
                "followup_id": followup.id,
                "client_id": payload.client_id,
                "client_name": client.name,
                "due_date": payload.due_date.isoformat()
            }
        )
    
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


# ── Routines CRUD ─────────────────────────────────────────────────────────────

@router.get("/me/routines", response_model=list[RoutineOut])
async def list_routines(
    is_template: bool | None = None,
    client_id: int | None = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[RoutineOut]:
    """List routines (templates or client-specific)"""
    professional = await _require_professional(current_user, db)
    
    query = (
        select(ExpertClientRoutine)
        .where(ExpertClientRoutine.professional_id == professional.user_id)
        .options(selectinload(ExpertClientRoutine.items))
        .order_by(ExpertClientRoutine.created_at.desc())
    )
    
    if is_template is not None:
        query = query.where(ExpertClientRoutine.is_template == is_template)
    if client_id is not None:
        query = query.where(ExpertClientRoutine.client_id == client_id)
    
    result = await db.execute(query)
    routines = result.scalars().all()
    return [RoutineOut.model_validate(r) for r in routines]


@router.post("/me/routines", response_model=RoutineOut, status_code=status.HTTP_201_CREATED)
async def create_routine(
    payload: RoutineIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> RoutineOut:
    """Create a new routine (template or client-specific)"""
    professional = await _require_professional(current_user, db)
    
    # If client_id provided, verify ownership
    if payload.client_id:
        client_result = await db.execute(
            select(ExpertClient).where(
                ExpertClient.id == payload.client_id,
                ExpertClient.professional_id == professional.user_id,
            )
        )
        if client_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    
    # Create routine
    routine = ExpertClientRoutine(
        professional_id=professional.user_id,
        client_id=payload.client_id,
        title=payload.title,
        description=payload.description,
        status=payload.status,
        source_type=payload.source_type,
        is_template=payload.is_template,
        template_id=payload.template_id,
        duration_weeks=payload.duration_weeks,
    )
    db.add(routine)
    await db.flush()  # Get routine.id for items
    
    # Create items
    for item_data in payload.items:
        item = ExpertClientRoutineItem(
            routine_id=routine.id,
            item_type=item_data.item_type,
            order=item_data.order,
            title=item_data.title,
            instructions=item_data.instructions,
            sets=item_data.sets,
            reps=item_data.reps,
            rest_seconds=item_data.rest_seconds,
            intensity=item_data.intensity,
            meal_type=item_data.meal_type,
            calories=item_data.calories,
        )
        db.add(item)
    
    await db.commit()
    await db.refresh(routine)
    
    # Load items
    result = await db.execute(
        select(ExpertClientRoutine)
        .where(ExpertClientRoutine.id == routine.id)
        .options(selectinload(ExpertClientRoutine.items))
    )
    routine_with_items = result.scalar_one()
    return RoutineOut.model_validate(routine_with_items)


@router.get("/me/routines/{routine_id}", response_model=RoutineOut)
async def get_routine(
    routine_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> RoutineOut:
    """Get a specific routine with items"""
    professional = await _require_professional(current_user, db)
    
    result = await db.execute(
        select(ExpertClientRoutine)
        .where(
            ExpertClientRoutine.id == routine_id,
            ExpertClientRoutine.professional_id == professional.user_id,
        )
        .options(selectinload(ExpertClientRoutine.items))
    )
    routine = result.scalar_one_or_none()
    if routine is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
    
    return RoutineOut.model_validate(routine)


@router.patch("/me/routines/{routine_id}", response_model=RoutineOut)
async def update_routine(
    routine_id: int,
    payload: RoutineUpdateIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> RoutineOut:
    """Update a routine"""
    professional = await _require_professional(current_user, db)
    
    result = await db.execute(
        select(ExpertClientRoutine).where(
            ExpertClientRoutine.id == routine_id,
            ExpertClientRoutine.professional_id == professional.user_id,
        )
    )
    routine = result.scalar_one_or_none()
    if routine is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(routine, field, value)
    
    routine.updated_at = datetime.utcnow()
    await db.commit()
    
    # Reload with items
    result = await db.execute(
        select(ExpertClientRoutine)
        .where(ExpertClientRoutine.id == routine_id)
        .options(selectinload(ExpertClientRoutine.items))
    )
    routine_with_items = result.scalar_one()
    return RoutineOut.model_validate(routine_with_items)


@router.delete("/me/routines/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_routine(
    routine_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    """Delete a routine"""
    professional = await _require_professional(current_user, db)
    
    result = await db.execute(
        select(ExpertClientRoutine).where(
            ExpertClientRoutine.id == routine_id,
            ExpertClientRoutine.professional_id == professional.user_id,
        )
    )
    routine = result.scalar_one_or_none()
    if routine is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
    
    await db.delete(routine)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/me/routines/{routine_id}/assign/{client_id}", response_model=RoutineOut, status_code=status.HTTP_201_CREATED)
async def assign_routine_to_client(
    routine_id: int,
    client_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> RoutineOut:
    """Assign a template routine to a client (creates a copy)"""
    professional = await _require_professional(current_user, db)
    
    # Verify template exists and belongs to professional
    template_result = await db.execute(
        select(ExpertClientRoutine)
        .where(
            ExpertClientRoutine.id == routine_id,
            ExpertClientRoutine.professional_id == professional.user_id,
            ExpertClientRoutine.is_template == True,
        )
        .options(selectinload(ExpertClientRoutine.items))
    )
    template = template_result.scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    
    # Verify client exists and belongs to professional
    client_result = await db.execute(
        select(ExpertClient).where(
            ExpertClient.id == client_id,
            ExpertClient.professional_id == professional.user_id,
        )
    )
    if client_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    
    # Create copy of routine for client
    new_routine = ExpertClientRoutine(
        professional_id=professional.user_id,
        client_id=client_id,
        title=template.title,
        description=template.description,
        status="published",  # Auto-publish assigned routines
        source_type=template.source_type,
        is_template=False,
        template_id=template.id,
        duration_weeks=template.duration_weeks,
        published_at=datetime.utcnow(),
    )
    db.add(new_routine)
    await db.flush()
    
    # Copy items
    for template_item in template.items:
        new_item = ExpertClientRoutineItem(
            routine_id=new_routine.id,
            item_type=template_item.item_type,
            order=template_item.order,
            title=template_item.title,
            instructions=template_item.instructions,
            sets=template_item.sets,
            reps=template_item.reps,
            rest_seconds=template_item.rest_seconds,
            intensity=template_item.intensity,
            meal_type=template_item.meal_type,
            calories=template_item.calories,
        )
        db.add(new_item)
    
    await db.commit()
    
    # Reload with items
    result = await db.execute(
        select(ExpertClientRoutine)
        .where(ExpertClientRoutine.id == new_routine.id)
        .options(selectinload(ExpertClientRoutine.items))
    )
    routine_with_items = result.scalar_one()
    return RoutineOut.model_validate(routine_with_items)


@router.patch("/me/routines/{routine_id}/items/{item_id}", response_model=RoutineItemOut)
async def update_routine_item(
    routine_id: int,
    item_id: int,
    payload: RoutineItemUpdateIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> RoutineItemOut:
    """Update a specific routine item (e.g., mark completed)"""
    professional = await _require_professional(current_user, db)
    
    # Verify routine belongs to professional
    routine_result = await db.execute(
        select(ExpertClientRoutine).where(
            ExpertClientRoutine.id == routine_id,
            ExpertClientRoutine.professional_id == professional.user_id,
        )
    )
    if routine_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
    
    # Get and update item
    item_result = await db.execute(
        select(ExpertClientRoutineItem).where(
            ExpertClientRoutineItem.id == item_id,
            ExpertClientRoutineItem.routine_id == routine_id,
        )
    )
    item = item_result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine item not found")
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    
    # Auto-set completed_at if marking completed
    if payload.completed is True and item.completed_at is None:
        item.completed_at = datetime.utcnow()
    elif payload.completed is False:
        item.completed_at = None
    
    await db.commit()
    await db.refresh(item)
    return RoutineItemOut.model_validate(item)


# ── Dashboard Metrics ─────────────────────────────────────────────────────────

@router.get("/me/clients/metrics", response_model=DashboardMetricsOut)
async def get_dashboard_metrics(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> DashboardMetricsOut:
    """Get dashboard metrics for the professional"""
    professional = await _require_professional(current_user, db)
    
    # Total clients
    total_clients_result = await db.execute(
        select(func.count(ExpertClient.id)).where(
            ExpertClient.professional_id == professional.user_id
        )
    )
    total_clients = total_clients_result.scalar() or 0
    
    # Active clients
    active_clients_result = await db.execute(
        select(func.count(ExpertClient.id)).where(
            ExpertClient.professional_id == professional.user_id,
            ExpertClient.status == "active",
        )
    )
    active_clients = active_clients_result.scalar() or 0
    
    # Followups due (unresolved)
    followups_due_result = await db.execute(
        select(func.count(ExpertClientFollowUp.id)).where(
            ExpertClientFollowUp.professional_id == professional.user_id,
            ExpertClientFollowUp.resolved == False,
        )
    )
    followups_due = followups_due_result.scalar() or 0
    
    # Leads pending (new or contacted status)
    leads_pending_result = await db.execute(
        select(func.count(ExpertLead.id)).where(
            ExpertLead.professional_id == professional.user_id,
            ExpertLead.status.in_(["new", "contacted"]),
        )
    )
    leads_pending = leads_pending_result.scalar() or 0
    
    return DashboardMetricsOut(
        total_clients=total_clients,
        active_clients=active_clients,
        followups_due=followups_due,
        leads_pending=leads_pending,
    )
