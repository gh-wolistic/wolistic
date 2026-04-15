# Tier Limit Enforcement Audit Report

**Date**: April 15, 2026  
**Status**: ⚠️ **CRITICAL GAP IDENTIFIED** - Tier limits not enforced in resource creation  
**Priority**: HIGH - Must be implemented before production deployment

---

## Executive Summary

The subscription tier system (Free/Pro/Elite/Celeb) has been successfully implemented with:
- ✅ Database migration complete
- ✅ Admin CRUD for subscription plans working
- ✅ Plan assignment to professionals working
- ✅ 54 automated tests passing (90% coverage)

**However**, the critical enforcement layer is **MISSING**:

> **No professional-facing endpoints currently enforce tier limits when resources are created.**

This means:
- A Free tier professional with `services_limit: 3` can create unlimited services
- A Pro tier professional with `classes_limit: 5` can create unlimited classes
- All tier limits are stored but **never checked**

---

## Critical Findings

### 🔴 CRITICAL: No Tier Enforcement Layer

**Current State**: 
- Professional has a `subscription` relationship in the Professional model
- `subscription.plan.limits` contains all tier limits (services_limit, classes_limit, etc.)
- **No endpoints check these limits before resource creation**

**Impact**:
- Tier differentiation is non-functional from user perspective
- Free users get same capabilities as Elite users
- Subscription revenue model cannot be monetized

**Risk**: HIGH - Core business model broken

---

## Resources Requiring Tier Enforcement

Based on the `tier_limits.py` schema, these resources need enforcement:

| Resource | Limit Key | Current Status | Priority |
|---|---|---|---|
| **Services** | `services_limit` | ❌ Not enforced | CRITICAL |
| **Classes** | `classes_limit` | ❌ Not enforced | CRITICAL |
| **Group Classes** | `group_classes_limit` | ❌ Not enforced | HIGH |
| **1:1 Sessions** | `one_to_one_session_types_limit` | ❌ Not enforced | HIGH |
| **Service Areas** | `service_areas_limit` | ❌ Not enforced | MEDIUM |
| **Photos** | `photos_limit` | ❌ Not enforced | MEDIUM |
| **Videos** | `videos_limit` | ❌ Not enforced | MEDIUM |
| **Certifications** | `certifications_limit` | ❌ Not enforced | MEDIUM |
| **Languages** | `languages_limit` | ❌ Not enforced | LOW |
| **Specializations** | `specializations_limit` | ❌ Not enforced | LOW |
| **Availability Slots** | `availability_slots_limit` | ❌ Not enforced | MEDIUM |
| **Booking Questions** | `booking_questions_limit` | ❌ Not enforced | LOW |

---

## Where Enforcement Is Needed

### 1. Service Creation
**File**: `backend/app/api/routes/professionals.py` (or wherever services are created via API)

**Current**: Services created during onboarding via `_build_default_initial_consultation_service()` - no limit check

**Required Logic**:
```python
async def create_professional_service(
    service_data: ServiceCreateIn,
    current_user: AuthenticatedUser,
    db: AsyncSession,
):
    # 1. Get professional's active subscription
    sub = await _get_active_subscription(current_user.user_id, db)
    
    # 2. Get current service count
    result = await db.execute(
        select(func.count(ProfessionalService.id))
        .where(
            ProfessionalService.professional_id == current_user.user_id,
            ProfessionalService.is_active.is_(True)
        )
    )
    current_count = result.scalar_one()
    
    # 3. Check against tier limit
    services_limit = sub.plan.limits.get("services_limit", 3)  # Default to Free tier
    if current_count >= services_limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Service limit reached. Your {sub.plan.tier} plan allows {services_limit} services. "
                   f"Upgrade to create more."
        )
    
    # 4. Create service
    service = ProfessionalService(...)
    db.add(service)
    await db.commit()
```

### 2. Class Creation
**File**: `backend/app/api/routes/classes.py`

**Current**: Unknown - need to audit if classes have POST endpoint

**Required**: Same pattern as services - count existing classes, compare to `classes_limit`

### 3. Media Upload (Photos/Videos)
**File**: `backend/app/api/routes/media.py` or similar

**Required**: Check `photos_limit` and `videos_limit` before allowing upload

### 4. Other Resources
Apply same pattern to all resources listed in table above

---

## Implementation Strategy

### Phase 1: Core Enforcement (CRITICAL - 3 hours)
1. Create helper function: `async def check_tier_limit(professional_id, limit_key, db) -> bool`
2. Implement enforcement for:
   - Services creation
   - Classes creation
   - Group classes creation
3. Write tests for enforcement logic

### Phase 2: Extended Enforcement (HIGH - 2 hours)
4. Implement enforcement for:
   - Service areas
   - Photos/videos
   - Certifications
   - Availability slots

### Phase 3: Complete Enforcement (MEDIUM - 2 hours)
5. Implement enforcement for remaining resources
6. Add frontend limit indicators (show "2/5 services used")
7. Add upgrade prompts in UI

---

## Helper Function Template

Create `backend/app/services/tier_enforcement.py`:

```python
from __future__ import annotations

import uuid
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.professional import Professional
from app.models.subscription import ProfessionalSubscription, SubscriptionPlan


async def check_tier_limit(
    professional_id: uuid.UUID,
    limit_key: str,
    resource_name: str,  # For error message: "services", "classes", etc.
    db: AsyncSession,
) -> None:
    """
    Check if professional can create more of a resource based on tier limits.
    
    Raises HTTPException 403 if limit reached.
    """
    # Get active subscription
    sub_result = await db.execute(
        select(ProfessionalSubscription, SubscriptionPlan)
        .join(SubscriptionPlan, SubscriptionPlan.id == ProfessionalSubscription.plan_id)
        .where(
            ProfessionalSubscription.professional_id == professional_id,
            ProfessionalSubscription.status == "active"
        )
    )
    sub_data = sub_result.one_or_none()
    
    if sub_data is None:
        # No active subscription - default to Free tier limits
        limit = 3  # Conservative default
    else:
        sub, plan = sub_data
        limit = plan.limits.get(limit_key)
        if limit is None:
            # Limit not defined in plan - allow unlimited (or set conservative default)
            return
    
    # Get current count (caller must provide table and filter)
    # This is simplified - real implementation needs to count actual resources
    
    if limit == -1:  # -1 = unlimited
        return
    
    # Note: Actual count check must be done by caller since each resource type has different table
    # This is a simplified version. Real implementation should accept a count parameter.


async def get_current_resource_count(
    professional_id: uuid.UUID,
    resource_type: Literal["services", "classes", "photos", "videos"],
    db: AsyncSession,
) -> int:
    """Get current count of a resource for a professional."""
    if resource_type == "services":
        from app.models.professional import ProfessionalService
        result = await db.execute(
            select(func.count(ProfessionalService.id))
            .where(
                ProfessionalService.professional_id == professional_id,
                ProfessionalService.is_active.is_(True)
            )
        )
    elif resource_type == "classes":
        from app.models.classes import ClassModel  # Adjust import
        result = await db.execute(
            select(func.count(ClassModel.id))
            .where(ClassModel.professional_id == professional_id)
        )
    # Add other resource types
    
    return result.scalar_one()


async def enforce_tier_limit(
    professional_id: uuid.UUID,
    limit_key: str,
    resource_type: str,
    db: AsyncSession,
) -> None:
    """
    Enforce tier limit for a resource. Raises 403 if limit reached.
    
    Example:
        await enforce_tier_limit(prof_id, "services_limit", "services", db)
    """
    # Get tier limit
    sub_result = await db.execute(
        select(ProfessionalSubscription, SubscriptionPlan)
        .join(SubscriptionPlan, SubscriptionPlan.id == ProfessionalSubscription.plan_id)
        .where(
            ProfessionalSubscription.professional_id == professional_id,
            ProfessionalSubscription.status == "active"
        )
    )
    sub_data = sub_result.one_or_none()
    
    if sub_data is None:
        # Default to Free tier
        tier = "free"
        limit = 3
    else:
        sub, plan = sub_data
        tier = plan.tier
        limit = plan.limits.get(limit_key, 3)
    
    if limit == -1:  # Unlimited
        return
    
    # Get current count
    current_count = await get_current_resource_count(professional_id, resource_type, db)
    
    if current_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "tier_limit_reached",
                "message": f"Your {tier.title()} plan allows {limit} {resource_type}. "
                          f"You currently have {current_count}. Upgrade to create more.",
                "current": current_count,
                "limit": limit,
                "tier": tier,
                "resource": resource_type,
            }
        )
```

---

## Testing Strategy

Create `backend/tests/test_tier_enforcement.py`:

```python
import pytest
from fastapi import HTTPException

@pytest.mark.asyncio
async def test_free_tier_service_limit(db_session, free_plan, professional):
    """Free tier should block 4th service creation."""
    # Assign Free plan (limit: 3 services)
    await assign_plan(professional.user_id, free_plan.id, db_session)
    
    # Create 3 services - should succeed
    for i in range(3):
        service = await create_service(professional.user_id, f"Service {i+1}", db_session)
        assert service.id is not None
    
    # 4th service - should fail
    with pytest.raises(HTTPException) as exc:
        await create_service(professional.user_id, "Service 4", db_session)
    
    assert exc.value.status_code == 403
    assert "tier_limit_reached" in exc.value.detail["error"]


@pytest.mark.asyncio
async def test_elite_tier_unlimited_services(db_session, elite_plan, professional):
    """Elite tier should allow unlimited services (-1 in limits)."""
    await assign_plan(professional.user_id, elite_plan.id, db_session)
    
    # Create 20 services - should all succeed
    for i in range(20):
        service = await create_service(professional.user_id, f"Service {i+1}", db_session)
        assert service.id is not None
```

---

## Recommendations

### Immediate Actions (Before Production)
1. ✅ **Implement enforcement for Services & Classes** (3 hours) - BLOCKING
2. ✅ **Write enforcement tests** (1 hour) - BLOCKING
3. ⚠️ **Document which features are gated** (30 min) - IMPORTANT

### Short-Term (Within 1 week)
4. Implement enforcement for media uploads
5. Add frontend limit indicators
6. Add "Upgrade" CTAs when limits reached

### Long-Term (Within 1 month)
7. Monitor limit breach attempts via analytics
8. A/B test limit values per tier
9. Add grace period for downgrades (allow existing resources beyond new limit)

---

## Sign-Off

**Status**: ⚠️ **IMPLEMENTATION REQUIRED**  
**Blocker**: Yes - cannot deploy subscription system without enforcement  
**Estimated Work**: 3-5 hours for critical enforcement layer  

**Next Steps**:
1. Create `tier_enforcement.py` service module
2. Add enforcement to service/class creation endpoints
3. Write 10-15 enforcement tests
4. Manual test upgrade/downgrade flows
5. Deploy with enforcement active

---

**Prepared by**: QA Lead (automated audit)  
**Review Date**: April 15, 2026  
**Next Audit**: After enforcement implementation
