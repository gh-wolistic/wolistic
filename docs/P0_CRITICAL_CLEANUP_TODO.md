# P0 CRITICAL CLEANUP & SECURITY TODO
**Generated:** April 14, 2026  
**Status:** 🔴 CRITICAL — Freeze new features until P0 items complete  
**Context:** Multi-agent codebase audit (CTO, Senior PM, QA Lead, Project Manager)

---

## 🚨 EXECUTIVE SUMMARY

**Critical Finding:** Wolistic has solid technical foundations (FastAPI, Supabase, async SQLAlchemy) but **subscription tier enforcement and security guardrails are completely missing**. This represents both a revenue leak (Free users accessing Pro features) and a security risk (no tier validation at API boundaries).

**Audit Process Failure (April 15, 2026):** A production-breaking bug introduced on March 17, 2026 in `intake.py` (commit f40e021) went undetected for 1 month and **was missed by the April 14 P0 audit**. Bug only affected authenticated users, bypassed exception handlers, and was discovered by user submission, not automated testing. **Root cause**: P0 audit relied exclusively on static analysis without end-to-end runtime testing.

**Recommendation:** 
1. **Immediate**: Complete Task 7 (AuthenticatedUser audit) with expanded scope including runtime E2E testing
2. **Before launch**: Complete all Phase 1 (P0) items  
3. **Process fix**: Implement E2E smoke tests + strict type checking in CI before next audit

**Launching with missing tier enforcement is a business-critical risk. Launching without E2E testing is an engineering-critical risk.**

---

## 📋 PHASE 1: MUST SHIP THIS WEEK (P0)

### 1. Delete Duplicate Model File ✅ COMPLETE
**Priority:** P0  
**Effort:** 30 minutes  
**Owner:** Backend Engineer  
**Status:** ✅ **COMPLETED April 15, 2026**

**Issue:**
- `backend/app/models/expert_client.py` defines 4 tables that are DUPLICATED in `backend/app/models/client.py`
- `expert_client.py` is NOT imported anywhere — it's orphaned code
- Causes schema confusion and maintenance risk

**Action:**
1. ✅ Verify `expert_client.py` is not imported anywhere (grep confirmed)
2. ✅ DELETE `backend/app/models/expert_client.py`
3. ✅ Run tests to confirm no breakage
4. ✅ Commit with message: "cleanup: remove duplicate expert_client model definitions"

**Done Criteria:** File deleted, all tests pass

**Results:**
- ✅ File deleted successfully
- ✅ Zero imports found across entire codebase
- ✅ Backend auto-reloaded via WatchFiles
- ✅ All models import correctly from `client.py`
- ✅ No migration needed (no schema changes)
- ✅ Health check passing (200 OK)

---

### 2. Implement Tier Gating System 🔒 CRITICAL
**Priority:** P0  
**Effort:** 8 hours  
**Owner:** Backend Engineer  
**Blocker for:** Tasks 3, 4, 10, 12

**Issue:**
- Subscription models exist (`SubscriptionPlan`, `ProfessionalSubscription`)
- **NO enforcement decorator or middleware exists**
- Routes have TODOs: `# TODO: Check user subscription tier is Pro or higher` (review.py:347)
- Free users can access Pro/Elite features → **revenue leak**

**Action:**

#### Step 1: Create Tier Decorator (2 hours)
File: `backend/app/core/auth.py`

```python
from functools import wraps
from typing import Literal

TierLevel = Literal["free", "pro", "elite", "celeb"]

TIER_HIERARCHY = {"free": 0, "pro": 1, "elite": 2, "celeb": 3}

async def require_tier(min_tier: TierLevel):
    """Decorator to enforce minimum subscription tier."""
    async def dependency(
        current_user: AuthenticatedUser = Depends(get_current_user),
        db: AsyncSession = Depends(get_db_session),
    ) -> AuthenticatedUser:
        # Fetch professional subscription
        result = await db.execute(
            select(ProfessionalSubscription, SubscriptionPlan)
            .join(SubscriptionPlan)
            .where(ProfessionalSubscription.professional_id == current_user.user_id)
            .where(ProfessionalSubscription.status == "active")
        )
        row = result.first()
        
        if not row:
            user_tier = "free"
        else:
            user_tier = row[1].tier  # SubscriptionPlan.tier
        
        if TIER_HIERARCHY.get(user_tier, 0) < TIER_HIERARCHY[min_tier]:
            raise HTTPException(
                status_code=403,
                detail=f"This feature requires {min_tier.title()} tier or higher"
            )
        
        return current_user
    
    return dependency
```

#### Step 2: Apply to Critical Routes (3 hours)

Priority routes to gate:

| Route | File | Min Tier | Reason |
|-------|------|----------|--------|
| POST `/api/v1/reviews/{review_id}/response` | review.py | Pro | Respond to reviews is Pro feature |
| GET `/api/v1/me/clients-board` | clients.py | Pro | Client CRM is Pro+ |
| POST `/api/v1/me/routines` | clients.py | Elite | AI routines is Elite feature |
| POST `/api/v1/me/classes` | classes.py | Elite | Group classes is Elite+ |
| GET `/api/v1/partner-dashboard/analytics` | partner_dashboard.py | Pro | Analytics is Pro+ |

**Example Application:**
```python
@router.post("/reviews/{review_id}/response")
async def submit_review_response(
    current_user: AuthenticatedUser = Depends(require_tier("pro")),
    db: AsyncSession = Depends(get_db_session),
):
    # ... implementation
```

#### Step 3: Add Helper to Check User Tier (1 hour)
```python
async def get_user_tier(user_id: UUID, db: AsyncSession) -> TierLevel:
    """Get current active tier for a user."""
    # Implementation
```

#### Step 4: Update Response Schemas (2 hours)
Add `current_tier` and `tier_limits` to `/auth/me` response so frontend can conditionally render features.

**Done Criteria:**
- ✅ `require_tier()` decorator implemented and tested
- ✅ Applied to 5 critical routes
- ✅ Returns 403 with clear error message
- ✅ `/auth/me` includes `current_tier` field

---

### 3. Write Subscription Tier Gating Tests 🧪 CRITICAL
**Priority:** P0  
**Effort:** 4 hours  
**Owner:** QA Engineer  
**Depends on:** Task 2

**Issue:**
- Zero test coverage for tier gating
- Cannot validate tier enforcement works correctly
- Regression risk on every deploy

**Action:**

Create `backend/tests/test_subscription_gating.py`:

```python
import pytest
from fastapi import status

# Test matrix: 4 tiers × 3 gated endpoints = 12 test cases

@pytest.mark.parametrize("user_tier,endpoint,expected_status", [
    ("free", "/api/v1/reviews/123/response", 403),
    ("pro", "/api/v1/reviews/123/response", 200),
    ("elite", "/api/v1/reviews/123/response", 200),
    ("free", "/api/v1/me/clients-board", 403),
    ("pro", "/api/v1/me/clients-board", 200),
    ("free", "/api/v1/me/routines", 403),
    ("pro", "/api/v1/me/routines", 403),
    ("elite", "/api/v1/me/routines", 201),
    # ... 12 total cases
])
async def test_tier_gating(user_tier, endpoint, expected_status, test_client, db_session):
    # Setup: Create user with specified tier
    # Execute: Call endpoint
    # Assert: Status code matches expected
```

**Test Coverage Required:**
1. Free user blocked from Pro features → 403
2. Pro user can access Pro features → 200
3. Pro user blocked from Elite features → 403
4. Elite user can access all features → 200
5. Celeb user can access all features → 200
6. Expired subscription treated as Free → 403 on Pro routes
7. Grace period subscription still has access → 200

**Done Criteria:**
- ✅ 12+ parametrized test cases
- ✅ All tests pass
- ✅ Test coverage >80% on auth.py tier enforcement code

---

### 4. Add Professional Verification Check 🔐 CRITICAL
**Priority:** P0  
**Effort:** 2 hours  
**Owner:** Backend Engineer

**Issue:**
- TODO in `review.py:41`: `# TODO: Verify user is a professional`
- Any user can submit reviews without being a verified professional
- Security vulnerability

**Action:**

Create decorator in `backend/app/core/auth.py`:

```python
async def require_professional(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> tuple[AuthenticatedUser, Professional]:
    """Ensure user is a verified professional with active profile."""
    result = await db.execute(
        select(Professional).where(Professional.user_id == current_user.user_id)
    )
    professional = result.scalar_one_or_none()
    
    if not professional:
        raise HTTPException(
            status_code=403,
            detail="This action requires a professional account"
        )
    
    # Check professional status (from users table)
    user_result = await db.execute(
        select(User).where(User.id == current_user.user_id)
    )
    user = user_result.scalar_one()
    
    if user.user_status != "verified":
        raise HTTPException(
            status_code=403,
            detail="Professional account must be verified to perform this action"
        )
    
    return current_user, professional
```

Apply to:
- All `/api/v1/me/*` routes in clients.py, activities.py, classes.py
- Review submission routes
- Booking management routes

**Done Criteria:**
- ✅ Decorator returns 403 if user is not professional
- ✅ Decorator returns 403 if professional is not verified
- ✅ Applied to 10+ routes
- ✅ Tests added for verification enforcement

---

### 5. Audit All Database Tables vs Route Usage 📊 CRITICAL
**Priority:** P0  
**Effort:** 3 hours  
**Owner:** CTO + Backend Engineer

**Issue:**
- Multiple tables defined but never used in routes
- Schema bloat and confusion
- Unclear which features are implemented vs planned

**Action:**

Create audit spreadsheet: `docs/schema_audit_2026_04_14.csv`

| Table Name | Route Usage | Migration | Status | Action |
|------------|-------------|-----------|--------|--------|
| users | ✅ auth.py, professionals.py | f577acd2eef7 | Active | Keep |
| professionals | ✅ Multiple routes | f577acd2eef7 | Active | Keep |
| bookings | ✅ booking.py | f577acd2eef7 | Active | Keep |
| expert_clients | ✅ clients.py | g12h3i4j5k6l | Active | Keep |
| professional_username_history | ❌ None found | n90p1q2r3s4t | Unused | Document or drop |
| professional_education | ❌ None found | f577acd2eef7 | Unused | Drop in migration |
| coin_rules | ❌ No admin routes | e53c8a2b7d41 | Partial | Needs admin UI |
| subscription_priority_tickets | ❌ None found | k67m8n9o1p2q | Unused | Document or drop |
| expert_review_requests | ⚠️ intake.py only | c3d9f0a4e8b2 | Partial | Needs testing |

**Method:**
1. List all tables from latest migration
2. Grep each table name in `backend/app/api/routes/*.py`
3. Mark as Active, Unused, or Partial
4. For Unused: decide drop vs document Phase 2 intent

**Done Criteria:**
- ✅ CSV file with all 60+ tables audited
- ✅ Recommendation for each unused table
- ✅ ADR created for tables marked "drop"

---

### 6. Add Admin Action Logging 📝 CRITICAL
**Priority:** P0  
**Effort:** 3 hours  
**Owner:** Backend Engineer

**Issue:**
- Admin routes use single shared API key
- No audit trail for admin actions
- Cannot trace who approved/suspended professionals
- Compliance risk

**Action:**

#### Step 1: Create Admin Audit Log Model

File: `backend/app/models/admin_audit.py`

```python
class AdminAuditLog(Base):
    """Immutable log of admin actions."""
    
    __tablename__ = "admin_audit_logs"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(255), nullable=False)
    admin_identifier: Mapped[str] = mapped_column(String(255), nullable=False)  # IP or key hash
    request_method: Mapped[str] = mapped_column(String(10), nullable=False)
    request_path: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    client_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
```

#### Step 2: Create Migration

```bash
cd backend
alembic revision -m "add_admin_audit_logs_table"
```

#### Step 3: Add Logging Middleware

File: `backend/app/core/middleware.py` (or create if doesn't exist)

```python
async def log_admin_action(
    action: str,
    resource_type: str,
    resource_id: str,
    request: Request,
    db: AsyncSession,
    payload: dict | None = None,
):
    """Log admin action to audit table."""
    # Extract admin identifier (could be IP hash + timestamp)
    admin_id = f"{request.client.host}|{datetime.utcnow().isoformat()}"
    
    log_entry = AdminAuditLog(
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        admin_identifier=admin_id,
        request_method=request.method,
        request_path=str(request.url),
        payload=payload,
        client_ip=request.client.host,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(log_entry)
    await db.commit()
```

#### Step 4: Apply to Admin Routes

Example in `admin.py`:

```python
@router.post("/professionals/{user_id}/approve")
async def approve_professional(
    user_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_admin_api_key),
):
    # ... existing logic ...
    
    # Add audit log
    await log_admin_action(
        action="approve_professional",
        resource_type="professional",
        resource_id=str(user_id),
        request=request,
        db=db,
    )
    
    return {"status": "approved"}
```

**Routes to Log:**
- POST `/admin/professionals/{user_id}/status`
- POST `/admin/professionals/{user_id}/approve`
- POST `/admin/professionals/{user_id}/suspend`
- POST `/admin/professionals/{user_id}/tier`
- POST `/admin/professionals/bulk-approve`
- All activity template CRUD (create/update/delete)

**Done Criteria:**
- ✅ `admin_audit_logs` table created
- ✅ Logging helper function implemented
- ✅ Applied to all 10+ admin endpoints
- ✅ Query endpoint: GET `/admin/audit-logs` (admin-only)

---

### 7. Audit AuthenticatedUser vs User Type Confusion 🐛 CRITICAL
**Priority:** P0  
**Effort:** 4 hours (EXPANDED from 1 hour)
**Owner:** Backend Engineer

**Issue:**
- `AuthenticatedUser` (dataclass) has `.user_id` attribute
- `User` (SQLAlchemy model) has `.id` attribute  
- Routes mixing these types caused 500 error in `intake.py` (line 26: `current_user.id` when it should be `current_user.user_id`)
- **PRODUCTION BUG**: Introduced March 17, 2026 in commit f40e021 ("dashboard_v1"), undetected for 1 month
- **P0 AUDIT FAILURE**: This bug was NOT caught by April 14 multi-agent audit — critical process gap

**Root Cause:**
- Auth refactoring (`get_optional_user` → `get_optional_current_user`) was incomplete
- Type annotations declared `User | None` but dependency returns `AuthenticatedUser | None`
- No strict type checking enforced in CI
- No end-to-end testing with authenticated users
- Bug bypassed exception handlers (happened before route logic executed)

**Systemic Risk:**
- ⚠️ **Other routes from dashboard_v1 refactoring may have same issue**
- ⚠️ **P0 audit process needs validation — static analysis alone is insufficient**

**Action:**

**PHASE 1: Audit dashboard_v1 Refactoring (2 hours)**
1. Review full commit f40e021 ("dashboard_v1"):
   ```bash
   git show f40e021 --stat
   git diff f40e021^..f40e021
   ```
2. Find ALL files that changed `get_optional_user` → `get_optional_current_user`
3. For each file, verify:
   - Type hint updated: `User | None` → `AuthenticatedUser | None`
   - Attribute access updated: `.id` → `.user_id`
   - Any `.email`, `.full_name` usage still valid
4. Create list of *every* route changed in dashboard_v1 for testing

**PHASE 2: Grep Pattern Audit (30 minutes)**
1. Search for anti-patterns introduced by refactoring:
   ```bash
   # Find type mismatches
   grep -r "User | None.*get_optional_current_user" backend/app/api/routes/
   grep -r "User | None.*get_current_user" backend/app/api/routes/
   
   # Find attribute mismatches  
   grep -r "current_user\.id" backend/app/api/routes/
   
   # Find old dependency name still in use
   grep -r "get_optional_user" backend/app/api/routes/
   ```

**PHASE 3: End-to-End Testing (1 hour)**
Test EVERY route that uses auth dependencies with:
- ✅ Authenticated user (valid JWT token)
- ✅ Unauthenticated user (no token)
- ✅ Invalid token (malformed JWT)
- ✅ Expired token

**PHASE 4: Create Regression Test Suite (30 minutes)**
Add tests for the bugs we just found:
```python
# backend/tests/test_auth_regression.py
async def test_authenticated_expert_review_submission():
    """Regression: intake.py used current_user.id instead of current_user.user_id"""
    # Test with valid auth token
    # Expect 201 Created, not 500
    
async def test_all_auth_routes_with_valid_token():
    """Ensure all auth-protected routes work with authenticated users"""
    # Matrix test all routes that use get_current_user or get_optional_current_user
```

**Files to Check:**
- `backend/app/api/routes/clients.py`
- `backend/app/api/routes/activities.py`
- `backend/app/api/routes/booking.py`
- `backend/app/api/routes/review.py`
- `backend/app/api/routes/partner_dashboard.py`
- Any route using auth dependencies

**Done Criteria:**
- ✅ All files from dashboard_v1 refactoring reviewed
- ✅ Zero instances of `current_user.id` with auth dependencies
- ✅ Zero instances of `User | None` with `get_optional_current_user()`
- ✅ All type hints match actual dependency return types  
- ✅ Regression test suite added and passing
- ✅ All auth-protected routes tested with authenticated users
- ✅ Document pattern in `.github/instructions/backend-patterns.md`

**Audit Process Improvements (Required for Future P0 Audits):**
- ✅ Add end-to-end testing to audit checklist (not just static analysis)
- ✅ Review git history for incomplete refactorings in last 60 days
- ✅ Test all user flows with both authenticated + unauthenticated states
- ✅ Run actual HTTP requests to endpoints, not just code review

**Next Sprint (P1):**
- Enable strict type checking (mypy) in CI pipeline
- Add pre-commit hooks to prevent type mismatches
- Implement smoke test suite that runs on every deployment

---

### 8. Implement E2E Smoke Test Suite 🧪 CRITICAL
**Priority:** P0  
**Effort:** 6 hours  
**Owner:** Backend Engineer + QA  
**Blocker for:** Future deploys

**Issue:**
- intake.py production bug (March 17) undetected for 1 month  
- April 14 P0 audit missed the bug — relied on static analysis only
- No automated end-to-end testing with real HTTP requests
- **This would have been caught immediately by E2E tests**

**Action:**

#### Step 1: Create Smoke Test Suite (3 hours)

File: `backend/tests/test_smoke_e2e.py`

```python
"""
End-to-end smoke tests — must pass before deploy.
These tests make real HTTP requests with real auth tokens.
"""

import pytest
from httpx import AsyncClient

@pytest.mark.smoke
async def test_all_auth_routes_with_authenticated_user(async_client: AsyncClient, auth_token: str):
    """Smoke test: all Depends(get_current_user) routes work with auth token."""
    
    routes_to_test = [
        ("GET", "/api/v1/auth/me"),
        ("POST", "/api/v1/intake/expert-review", {"query": "test", "scope": "professionals", "answers": {}}),
        ("GET", "/api/v1/me/activities"),
        ("GET", "/api/v1/me/classes"),
        ("GET", "/api/v1/me/clients"),
        # ... all critical user-facing routes
    ]
    
    for method, path, *payload in routes_to_test:
        resp = await async_client.request(
            method, 
            path, 
            json=payload[0] if payload else None,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code < 500, f"{method} {path} returned 500 (should not for valid auth)"


@pytest.mark.smoke
async def test_optional_auth_routes_both_states(async_client: AsyncClient, auth_token: str):
    """Smoke test: optional auth routes work both authenticated AND unauthenticated."""
    
    optional_routes = [
        ("POST", "/api/v1/intake/expert-review", {"query": "test", "scope": "professionals", "answers": {}}),
        ("GET", "/api/v1/search/professionals", {"q": "yoga"}),
    ]
    
    for method, path, *payload in optional_routes:
        # Test unauthenticated
        resp_unauth = await async_client.request(method, path, json=payload[0] if payload else None)
        assert resp_unauth.status_code < 500, f"{method} {path} failed unauthenticated"
        
        # Test authenticated  
        resp_auth = await async_client.request(
            method, path, 
            json=payload[0] if payload else None,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp_auth.status_code < 500, f"{method} {path} failed authenticated"
```

#### Step 2: Add to CI Pipeline (1 hour)

File: `.github/workflows/backend-tests.yml` (or create)

```yaml
- name: Run smoke tests
  run: |
    cd backend
    pytest -m smoke --maxfail=1 -v
```

#### Step 3: Pre-Deploy Validation (1 hour)

Create script: `backend/scripts/pre_deploy_check.sh`

```bash
#!/bin/bash
# Run before every deploy — must pass or deployment blocked

echo "Running smoke tests..."
pytest -m smoke --maxfail=1

if [ $? -ne 0 ]; then
    echo "❌ SMOKE TESTS FAILED — DEPLOY BLOCKED"
    exit 1
fi

echo "✅ Smoke tests passed"
```

#### Step 4: Type Checking in CI (1 hour)

```yaml
- name: Type check
  run: |
    cd backend
    pip install mypy types-sqlalchemy
    mypy app --strict
```

**Done Criteria:**
- ✅ Smoke test suite covers all auth-protected routes
- ✅ Tests run in CI on every PR
- ✅ Tests block deploy if they fail
- ✅ Type checking (mypy --strict) runs in CI
- ✅ All existing routes pass smoke tests

**Why This Fixes The Audit Gap:**
- Would have caught intake.py bug on March 17 within minutes
- Prevents "works unauthenticated, breaks authenticated" bugs
- Validates type safety at runtime, not just static analysis
- Runs on every deploy → no more month-long silent failures

---

## 📋 PHASE 2: MUST SHIP NEXT SPRINT (P1)

### 9. Clarify Catalog vs Wolistic Content Domain 📖
**Priority:** P1  
**Effort:** 2 hours  
**Owner:** Senior PM + CTO

**Issue:**
- Dual schema: `catalog_*` tables AND `wolistic_*` tables for products/services
- Dual routes: `/catalog/*` AND `/products/*`, `/wellness-centers/*`
- Unclear which is source of truth

**Action:**

Create ADR (Architecture Decision Record): `docs/adr/001-catalog-vs-wolistic-content.md`

**Decision Options:**
1. **Catalog = Partner-submitted, Wolistic = Curated**
   - Catalog is marketplace (experts can add brands/products)
   - Wolistic Content is editorial (Wolistic team curates)
2. **Merge into Single Schema**
   - Deprecate one set of tables
   - Add `source` field: "partner" | "editorial"
3. **Phase Out Wolistic Content**
   - Keep only catalog tables
   - Migrate existing wolistic_* data to catalog_*

**Recommendation:** Option 1 (clear domain separation) with schema comments added to models

**Done Criteria:**
- ✅ ADR published with decision
- ✅ Schema comments added to both model files
- ✅ API documentation updated to clarify use cases

---

### 10. Build Admin CRUD for Coin Rules 💰
**Priority:** P1  
**Effort:** 6 hours  
**Owner:** Backend Engineer

**Issue:**
- `CoinRule` model exists with `event_type`, `base_amount`, `tier_multipliers`
- No admin interface to configure rules
- Earn rates are either hardcoded or missing
- Cannot A/B test coins incentives

**Action:**

Create routes in `backend/app/api/routes/coins.py`:

```python
# Admin Routes
@router.get("/admin/coin-rules", response_model=list[CoinRuleOut], tags=["admin"])
async def list_coin_rules(
    _: None = Depends(require_admin_api_key),
    db: AsyncSession = Depends(get_db_session),
):
    """List all coin earning rules."""
    # Implementation

@router.post("/admin/coin-rules", response_model=CoinRuleOut, tags=["admin"])
async def create_coin_rule(
    rule_in: CoinRuleCreate,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_admin_api_key),
):
    """Create new coin earning rule."""
    # Implementation + audit log

@router.patch("/admin/coin-rules/{rule_id}", response_model=CoinRuleOut, tags=["admin"])
async def update_coin_rule(
    rule_id: int,
    rule_in: CoinRuleUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_admin_api_key),
):
    """Update existing coin rule."""
    # Implementation + audit log
```

**Event Types to Support:**
- `profile_verified` (one-time)
- `booking_completed` (per booking)
- `review_received` (per review)
- `daily_login` (once per day)
- `referral_signup` (per successful referral)

**Schema:**
```python
class CoinRuleOut(BaseModel):
    id: int
    event_type: str
    base_amount: int
    tier_multipliers: dict  # {"free": 1.0, "pro": 1.5, "elite": 2.0}
    is_active: bool
    description: str | None
```

**Done Criteria:**
- ✅ Admin can list/create/update coin rules
- ✅ Rule changes are audit-logged
- ✅ Tested with Postman/curl

---

### 11. Coin Wallet Reconciliation Job 🔄
**Priority:** P1  
**Effort:** 4 hours  
**Owner:** Backend Engineer

**Issue:**
- `CoinWallet.balance` is cached/mutable field
- Risk of desync from `CoinTransaction` ledger on partial failures
- No validation that cached balance matches ledger sum

**Action:**

Create script: `backend/app/scripts/reconcile_coin_wallets.py`

```python
async def reconcile_wallet(user_id: UUID, db: AsyncSession) -> dict:
    """Reconcile wallet balance with transaction ledger."""
    
    # Get wallet cached balance
    wallet = await db.scalar(
        select(CoinWallet).where(CoinWallet.user_id == user_id)
    )
    if not wallet:
        return {"status": "no_wallet"}
    
    # Calculate true balance from ledger
    ledger_balance = await db.scalar(
        select(func.sum(CoinTransaction.amount))
        .where(CoinTransaction.user_id == user_id)
    ) or 0
    
    # Compare
    if wallet.balance != ledger_balance:
        drift = wallet.balance - ledger_balance
        # Alert + log
        logger.error(
            f"Wallet drift detected: user={user_id}, "
            f"cached={wallet.balance}, ledger={ledger_balance}, drift={drift}"
        )
        
        # Auto-fix if drift < 1%
        if abs(drift) / max(ledger_balance, 1) < 0.01:
            wallet.balance = ledger_balance
            await db.commit()
            return {"status": "auto_fixed", "drift": drift}
        
        return {"status": "drift_detected", "drift": drift}
    
    return {"status": "ok"}

async def reconcile_all_wallets():
    """Nightly job: reconcile all wallets."""
    async with get_db_session() as db:
        wallets = await db.scalars(select(CoinWallet))
        for wallet in wallets:
            result = await reconcile_wallet(wallet.user_id, db)
            if result["status"] == "drift_detected":
                # Send alert (email/Slack)
                pass
```

**Deployment:**
- Add to cron: `0 2 * * * python -m app.scripts.reconcile_coin_wallets`
- Or use Celery/async scheduler
- Alert on drift >1% to Slack/email

**Done Criteria:**
- ✅ Script reconciles wallet vs ledger
- ✅ Auto-fixes small drifts (<1%)
- ✅ Alerts on significant drifts
- ✅ Scheduled to run nightly

---

### 12. Tier Downgrade Access Revocation ⬇️
**Priority:** P1  
**Effort:** 4 hours  
**Owner:** Backend Engineer  
**Depends on:** Task 2

**Issue:**
- What happens when Pro user's subscription expires?
- Do they keep access to Pro features?
- No documented downgrade logic

**Action:**

#### Step 1: Subscription Status Check on Request
Already handled by `require_tier()` decorator (Task 2) — it checks `status == "active"`

#### Step 2: Batch Job to Expire Subscriptions

Create: `backend/app/scripts/expire_subscriptions.py`

```python
async def expire_ended_subscriptions():
    """Mark subscriptions as expired if ends_at < now."""
    async with get_db_session() as db:
        now = datetime.utcnow()
        
        result = await db.execute(
            select(ProfessionalSubscription)
            .where(ProfessionalSubscription.status == "active")
            .where(ProfessionalSubscription.ends_at < now)
        )
        expired = result.scalars().all()
        
        for sub in expired:
            sub.status = "expired"
            logger.info(f"Expired subscription for professional_id={sub.professional_id}")
        
        await db.commit()
        
        return len(expired)
```

Run hourly via cron.

#### Step 3: Grace Period Logic

If business wants 7-day grace period:
- Keep `status = "active"` for 7 days after `ends_at`
- After 7 days, set `status = "grace"`
- After grace period, set `status = "expired"`

Modify `require_tier()` to allow `status IN ("active", "grace")`

**Done Criteria:**
- ✅ Expired subscriptions auto-downgrade to Free
- ✅ Pro features return 403 after expiry
- ✅ Grace period logic implemented (optional)
- ✅ Test: subscribe → expire → verify access revoked

---

### 13. Rate Limiting Middleware ⚡
**Priority:** P1  
**Effort:** 4 hours  
**Owner:** Backend Engineer

**Issue:**
- No rate limiting visible
- API vulnerable to abuse/DoS
- No per-user request throttling

**Action:**

Use `slowapi` library:

```bash
pip install slowapi
```

Add to `backend/app/main.py`:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to routes
@app.get("/api/v1/search/professionals")
@limiter.limit("100/minute")
async def search_professionals(...):
    pass
```

**Limits:**
- Global: 1000 req/min per IP
- Search: 100 req/min per IP
- Auth: 10 req/min per IP (login/signup)
- Admin: 50 req/min per IP

For authenticated routes, switch to `key_func=get_user_id` (extract from JWT)

**Done Criteria:**
- ✅ Rate limiter configured
- ✅ Returns 429 status on limit exceeded
- ✅ Applied to all public routes
- ✅ Tested with load testing tool

---

### 14. Frontend: Tier Upgrade Prompts at Feature Gates 🎯
**Priority:** P1  
**Effort:** 6 hours  
**Owner:** Frontend Engineer  
**Depends on:** Task 2, 3

**Issue:**
- Backend now returns 403 on tier-gated features
- Frontend should show upgrade prompt, not generic error

**Action:**

#### Step 1: Create UpgradePromptModal Component

File: `frontend/components/ui/upgrade-prompt-modal.tsx`

```tsx
export function UpgradePromptModal({
  requiredTier,
  feature,
  isOpen,
  onClose,
}: {
  requiredTier: "pro" | "elite" | "celeb";
  feature: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Upgrade to {requiredTier.toUpperCase()}</AlertDialogTitle>
          <AlertDialogDescription>
            {feature} is available for {requiredTier.toUpperCase()} tier professionals.
            Upgrade now to unlock this feature and more.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <p className="text-sm">✨ {requiredTier.toUpperCase()} Features:</p>
          <ul className="text-sm list-disc pl-5">
            {/* Feature list based on tier */}
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Maybe Later</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link href="/v1/profile/subscription">
              Upgrade Now →
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

#### Step 2: Add Error Interceptor

File: `frontend/lib/api-client.ts`

```typescript
async function fetchWithTierCheck(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  
  if (response.status === 403) {
    const error = await response.json();
    if (error.detail?.includes("requires")) {
      // Extract required tier from error message
      const tierMatch = error.detail.match(/(pro|elite|celeb) tier/i);
      if (tierMatch) {
        // Emit event for modal
        window.dispatchEvent(new CustomEvent("tier-upgrade-required", {
          detail: {
            requiredTier: tierMatch[1].toLowerCase(),
            feature: url.split("/").pop(),
          }
        }));
      }
    }
  }
  
  return response;
}
```

#### Step 3: Add to Feature Buttons

Example: Client CRM page

```tsx
<Button onClick={async () => {
  try {
    await fetchClientsBoard();
  } catch (err) {
    // If 403, modal will auto-open via event listener
  }
}}>
  View Clients Board
</Button>
```

**Done Criteria:**
- ✅ Modal component created
- ✅ Shows on 403 with tier requirement parsed
- ✅ Applied to 5+ gated features
- ✅ "Upgrade Now" links to subscription page

---

## 📋 PHASE 3: TECHNICAL DEBT (P2)

### 15. Migrate Admin Auth from API Key to JWT Roles
**Priority:** P2  
**Effort:** 8 hours

**Issue:**
- Current: Single shared API key
- No per-admin accountability
- Cannot revoke individual admin access

**Action:**
1. Add `role` field to `users` table: "user" | "admin" | "super_admin"
2. Add role to JWT claims during login
3. Create `@require_role("admin")` decorator
4. Deprecate `require_admin_api_key`
5. Keep API key for backward compat (1 sprint grace period)
6. Remove API key auth after migration

---

### 16. Input Sanitization for XSS Prevention
**Priority:** P2  
**Effort:** 6 hours

**Issue:**
- Text fields (bios, reviews, notes) accept raw HTML
- XSS vulnerability

**Action:**
1. Install `bleach` library
2. Create sanitization helper
3. Apply to all text fields in create/update endpoints
4. Allow safe tags: `<b>`, `<i>`, `<p>`, `<br>`
5. Strip everything else

---

### 17. Switch Booking Reference to UUID
**Priority:** P2  
**Effort:** 3 hours

**Issue:**
- `booking_reference` is String(64)
- Allows enumeration attacks

**Action:**
1. Create migration to change to UUID
2. Update booking creation logic
3. Update frontend to handle UUID format

---

### 18. Add Pessimistic Locking for Booking Slots
**Priority:** P2  
**Effort:** 6 hours

**Issue:**
- Two users can book same timeslot simultaneously
- Race condition

**Action:**
1. Add `SELECT ... FOR UPDATE` when checking slot availability
2. Add unique constraint on (professional_id, scheduled_for)
3. Handle IntegrityError gracefully

---

### 19. Database Index Audit
**Priority:** P2  
**Effort:** 4 hours

**Action:**
1. Enable slow query logging
2. Collect 1 week of logs
3. Add indexes for queries >120ms
4. Focus on:
   - Foreign key columns
   - WHERE clause columns
   - ORDER BY columns
   - JOIN columns

---

## 🗑️ CLEANUP: DOCUMENTATION DEBT

### Docs to Archive or Delete

Move to `docs/archive/`:
- ❌ `AI_DONT_DELETE_PIVOT_TO_MIN_MVP.md` — Pivot is done, archive it
- ❌ `AI_DONT_DELETE_TODO_WORKLIST.md` — TODOs belong in issues, not docs
- ❌ `AI_DONT_DELETE_OWNERSHIP_MATRIX.md` — Likely outdated ownership
- ❌ `high_priority_refactor_todo.md` — Convert to GitHub issues or delete

Keep and Maintain:
- ✅ `AI_DONT_DELETE_ARCHITECTURE.md` → Rename to `ARCHITECTURE.md`
- ✅ `AI_DONT_DELETE_HOLISTIC_PLAN.md` → Rename to `PRODUCT_VISION.md`
- ✅ `reviews-ui-specification.md` — Keep, feature-specific
- ✅ `ux-review-messaging-2026-04-13.md` — Keep, recent UX review

**Action for PHASE 2:**
Review remaining docs individually and either update or archive.

---

## 🚫 BLOCKERS & DECISIONS NEEDED

| Item | Blocker | Required From | Priority |
|------|---------|---------------|----------|
| Catalog vs Wolistic Content strategy | Decision needed | Senior PM | P1 |
| Coin rule defaults (earn rates) | Business input | Senior PM + Finance | P1 |
| Review response tier (Pro or Elite?) | Pricing strategy | Senior PM | P0 |
| Grace period duration for expired subs | Product decision | Senior PM | P1 |
| Admin JWT role implementation timeline | Security priority | CTO | P2 |

---

## 📊 SUCCESS METRICS

### Phase 1 (P0) Success Criteria:
- ✅ Zero duplicate model files in codebase
- ✅ 100% of revenue-generating features tier-gated
- ✅ >80% test coverage on tier enforcement
- ✅ All admin actions audit-logged
- ✅ Schema audit spreadsheet complete

### Phase 2 (P1) Success Criteria:
- ✅ Coin wallet drift alerts <0.1% of wallets
- ✅ Rate limiting preventing >95% of abuse attempts
- ✅ Tier downgrade access revoked within 1 hour
- ✅ Frontend upgrade prompts >60% conversion to upgrade page

### Phase 3 (P2) Success Criteria:
- ✅ Zero XSS vulnerabilities in pen test
- ✅ Zero race conditions in booking flow
- ✅ P99 query latency <200ms

---

## 🎯 TIMELINE ESTIMATE

| Phase | Duration | Team Size | Calendar Days | Progress |
|-------|----------|-----------|---------------|----------|
| Phase 1 (P0) | 35 hours (+6 for E2E tests) | 2 engineers + 1 QA | 4-6 days | ✅ 0.5h complete (Task 1) |
| Phase 2 (P1) | 32 hours | 2 engineers + 1 frontend | 5-7 days | ⏳ Pending |
| Phase 3 (P2) | 35 hours | 1 engineer | 10-15 days | ⏳ Pending |

**Total:** 3-4 weeks for all phases (assuming dedicated focus)

**P0 expanded due to audit process failure:** Added Task 7 (expanded to 4 hrs) and Task 8 (E2E smoke tests, 6 hrs)

**Recommendation:** Complete Phase 1 before ANY new feature work. **Phase 1 Task 8 (E2E tests) is blocker for all future deploys.**

**Latest Update (April 15, 2026):**
- ✅ Task 1 complete: Duplicate model file deleted, verified, no migration needed

---

## 📝 NOTES

### Why Tier Gating is Revenue-Critical
- Current state: Free users can access Pro/Elite features → $0 revenue
- Properly gated: Free users hit paywall → conversion funnel activated
- Industry standard: 2-5% paywall conversion rate
- If 1000 Free users hit Pro features/month, 20-50 should convert at $20/mo = $400-1000 MRR gained

### Why Duplicate Model File is Critical
- Indicates weak code review process
- Risk of schema divergence over time
- Confuses new developers joining the team
- Simple fix with high confidence gain

### Why Admin Audit Logging is Critical
- Compliance requirement for HIPAA/GDPR if handling health data
- Essential for forensics if professional disputes admin action
- Standard practice for any admin interface

### Why AuthenticatedUser Type Audit is Critical
- Runtime bug that bypassed all exception handlers (happened before route code)
- Failed **only** for authenticated users → appears intermittent, hard to debug
- Type mismatch (`User` vs `AuthenticatedUser`) should be caught by type checker
- Indicates missing type enforcement in CI → systemic risk
- One instance found = likely more exist across route files
- Silent failure mode: works for unauthenticated, breaks for logged-in users
- **AUDIT FAILURE**: Introduced March 17, undetected for 1 month, missed by April 14 P0 audit
- **Discovered by**: User reporting 500 error, not by automated testing or code review

### Lessons Learned: Why This P0 Audit Failed
1. **Static analysis is insufficient** — must include runtime end-to-end testing
2. **Test with real user sessions** — authenticated vs unauthenticated states
3. **Review recent refactorings** — incomplete migrations are high-risk
4. **Type checking not enforced** — mypy/pyright would have caught this
5. **Exception handlers didn't help** — bug happened before FastAPI route logic
6. **"No errors in logs" ≠ working** — unauthenticated path worked, authenticated path silently broken for weeks

### Process Improvements Required
- [ ] Add end-to-end smoke tests to CI pipeline
- [ ] Enable strict type checking (mypy) in CI
- [ ] Add pre-commit type validation hooks
- [ ] Test matrix: every endpoint × [authenticated, unauthenticated, invalid token]
- [ ] Review git history for incomplete refactorings in every audit
- [ ] Document: "P0 audit must include runtime testing, not just code review"

---

**Last Updated:** April 15, 2026 (Post-Audit Failure Analysis)  
**Next Review:** After Phase 1 completion (target: April 21, 2026)

**Audit History:**
- April 14, 2026: Initial P0 audit (7 tasks identified)
- April 15, 2026: Audit failure discovered — production bug from March 17 was missed. Added Tasks 7 (expanded) and 8 (E2E testing). Updated from 29h to 35h total P0 work.
