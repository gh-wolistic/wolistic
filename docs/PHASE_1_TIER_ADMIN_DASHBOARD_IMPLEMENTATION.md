# Phase 1: Subscription & Tier Admin Dashboard Implementation

**Document Version:** 1.0  
**Created:** April 15, 2026  
**Status:** 🟡 Ready for Implementation  
**Estimated Effort:** 2-3 days (16-24 hours)  
**Quality Standard:** Best-in-class, zero-bug tolerance

---

## 🎯 PHASE 1 OBJECTIVES

**Primary Goal**: Enable admins to configure comprehensive 4-tier subscription system (Free, Pro, Elite, Celeb) with granular limit definitions, while auto-migrating all existing professionals to Free tier.

**Success Criteria**:
- ✅ Admins can create/edit 4 subscription plans with 30+ limit fields
- ✅ 100% of existing professionals assigned Free tier subscriptions
- ✅ Celeb tier created but marked "Coming Soon" (not assignable)
- ✅ All limit changes tracked in audit logs
- ✅ Zero data corruption, zero production errors
- ✅ 100% test coverage on critical paths
- ✅ MyPy type checking passes with zero errors

**Non-Goals** (Deferred to Phase 2):
- ❌ Backend limit enforcement (API validation)
- ❌ Frontend tier-aware UX (progress bars, upgrade modals)
- ❌ Usage tracking infrastructure

---

## 📋 IMPLEMENTATION TASK BREAKDOWN

### Task 1: Database Migration - Add Celeb Tier + Comprehensive Limits Schema
**Owner:** Backend  
**Effort:** 2 hours  
**Priority:** P0 (Blocker for all other tasks)

#### Subtasks
1. **Create Alembic migration file** (`[timestamp]_add_celeb_tier_comprehensive_limits.py`)
   - Add `coming_soon` boolean column to `subscription_plans` table
   - Add CHECK constraint: `tier IN ('free', 'pro', 'elite', 'celeb')`
   - Update existing plans to set `coming_soon = false`
   - Document comprehensive limits schema in migration docstring

2. **Document comprehensive limits structure**
   - Add docstring with full JSONB schema (30+ fields)
   - Include type hints for each limit field (int, bool, float)
   - Add examples for each tier (Free, Pro, Elite, Celeb)

3. **Test migration**
   - Test upgrade: `docker exec backend alembic upgrade head`
   - Test downgrade: `docker exec backend alembic downgrade -1`
   - Verify constraint: Try to insert plan with `tier='invalid'` → should fail
   - Verify column: Query `coming_soon` field → should exist

#### Files to Create
```
backend/alembic/versions/[timestamp]_add_celeb_tier_comprehensive_limits.py
```

#### Files to Modify
```
None (pure migration)
```

#### Migration SQL (Preview)
```sql
-- Upgrade
ALTER TABLE subscription_plans 
  ADD COLUMN coming_soon BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE subscription_plans 
  ADD CONSTRAINT tier_valid_values 
  CHECK (tier IN ('free', 'pro', 'elite', 'celeb'));

UPDATE subscription_plans SET coming_soon = FALSE WHERE coming_soon IS NULL;

-- Downgrade
ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS tier_valid_values;
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS coming_soon;
```

#### Testing Checklist
- [ ] Migration applies without errors (upgrade)
- [ ] Migration reverses without errors (downgrade)
- [ ] `coming_soon` column exists and defaults to `false`
- [ ] Tier constraint rejects invalid values
- [ ] Existing plans still queryable after migration
- [ ] No data loss (count before = count after)

#### Quality Gates
- ✅ Migration tested in local Docker environment
- ✅ Migration tested with rollback (downgrade → upgrade)
- ✅ No SQL errors in logs
- ✅ All existing subscription plan records preserved

---

### Task 2: Backend Models - Update SubscriptionPlan with Comprehensive Limits
**Owner:** Backend  
**Effort:** 2 hours  
**Priority:** P0  
**Depends On:** Task 1 (migration must be applied)

#### Subtasks
1. **Extend SubscriptionPlan model** (`backend/app/models/subscription.py`)
   - Add `coming_soon: Mapped[bool]` field
   - Add comprehensive docstring documenting all 30+ limit fields
   - Add type hints in comments for JSONB fields

2. **Create limits schema TypeDict** (optional but recommended)
   - CREATE: `backend/app/schemas/tier_limits.py`
   - Define `TierLimits` TypedDict with all limit fields
   - Use for validation and type safety

3. **Update Pydantic schemas** (`backend/app/schemas/subscription.py`)
   - Add `coming_soon: bool` to `SubscriptionPlanOut`
   - Add `coming_soon: bool | None` to `SubscriptionPlanPatch`
   - Add comprehensive `limits` validation examples

#### Files to Create
```
backend/app/schemas/tier_limits.py (optional TypedDict)
```

#### Files to Modify
```
backend/app/models/subscription.py
backend/app/schemas/subscription.py
```

#### Code Changes

**backend/app/models/subscription.py**
```python
# ADD after line ~42 (is_active field)
coming_soon: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")

# UPDATE docstring (after line 13)
"""
A subscription plan definition, scoped by expert_type (body/mind/diet/all).

Comprehensive Limits Schema (stored in JSONB 'limits' field):

PROFILE LIMITS (Common Infrastructure):
- certificates_limit (int): Max verified certifications
- languages_limit (int): Max languages offered
- education_items_limit (int): Max education entries
- expertise_areas_limit (int): Max expertise tags
- approaches_limit (int): Max therapeutic approaches
- subcategories_limit (int): Max service subcategories
- gallery_items_limit (int): Max gallery photos/videos
- booking_questions_limit (int): Max custom booking questions

OPERATIONAL LIMITS (Tier-Based):
- services_limit (int): Max active service offerings
- booking_slots_limit (int): Max availability slots per month
- client_invites_per_day (int): Max client invites per day
- client_invites_per_month (int): Max client invites per month
- leads_per_day (int): Max new leads accepted per day
- leads_total_limit (int): Max total active leads
- followups_per_day (int): Max follow-ups created per day
- followups_total_limit (int): Max active follow-ups
- routines_limit (int): Max active client routines
- routine_templates_limit (int): Max reusable routine templates
- group_classes_limit (int): Max active group classes
- activity_manager_yet_to_start_cap (int): Max "yet to start" items
- activity_manager_in_progress_cap (int): Max "in progress" items
- classes_sessions_limit (int): Max total classes/sessions
- messages_retention_days (int): Chat history retention (days)

FUTURE LIMITS (Phase 2+):
- jobs_marketplace_applications_per_month (int)
- priority_matchmaking_weight (float)
- ai_routine_credits_per_month (int)
- custom_client_filters_limit (int)
- feed_posts_per_week (int)
- client_showcase_slots (int)

FEATURE FLAGS:
- can_reply_to_reviews (bool): Can respond to reviews
- can_receive_reviews (bool): Can receive reviews
- featured_in_search (bool): Boosted search ranking
- priority_support (bool): Priority customer support
- ai_routine_privacy (bool): AI can't read routines
- white_label_branding (bool): Custom branding
- dedicated_account_manager (bool): Personal account manager
- brand_collaboration_priority (bool): Priority brand access

MULTIPLIERS:
- coin_multiplier (float): Coin earn rate multiplier
- search_ranking_boost (float): Search ranking boost
- review_weight_multiplier (float): Review credibility weight
"""
```

**backend/app/schemas/subscription.py**
```python
# UPDATE SubscriptionPlanOut (add field after line ~25)
coming_soon: bool

# UPDATE SubscriptionPlanPatch (add field after line ~52)
coming_soon: bool | None = None
```

**backend/app/schemas/tier_limits.py** (NEW FILE - Optional)
```python
"""
TypedDict definitions for subscription tier limits.
Provides type safety for JSONB limits field.
"""
from typing import TypedDict, NotRequired


class TierLimits(TypedDict, total=False):
    """Comprehensive tier limits structure (JSONB)."""
    
    # Profile Limits
    certificates_limit: int
    languages_limit: int
    education_items_limit: int
    expertise_areas_limit: int
    approaches_limit: int
    subcategories_limit: int
    gallery_items_limit: int
    booking_questions_limit: int
    
    # Operational Limits
    services_limit: int
    booking_slots_limit: int
    client_invites_per_day: int
    client_invites_per_month: int
    leads_per_day: int
    leads_total_limit: int
    followups_per_day: int
    followups_total_limit: int
    routines_limit: int
    routine_templates_limit: int
    group_classes_limit: int
    activity_manager_yet_to_start_cap: int
    activity_manager_in_progress_cap: int
    classes_sessions_limit: int
    messages_retention_days: int
    
    # Future Limits
    jobs_marketplace_applications_per_month: NotRequired[int]
    priority_matchmaking_weight: NotRequired[float]
    ai_routine_credits_per_month: NotRequired[int]
    custom_client_filters_limit: NotRequired[int]
    feed_posts_per_week: NotRequired[int]
    client_showcase_slots: NotRequired[int]
    
    # Feature Flags
    can_reply_to_reviews: bool
    can_receive_reviews: bool
    featured_in_search: bool
    priority_support: bool
    ai_routine_privacy: NotRequired[bool]
    white_label_branding: NotRequired[bool]
    dedicated_account_manager: NotRequired[bool]
    brand_collaboration_priority: NotRequired[bool]
    
    # Multipliers
    coin_multiplier: float
    search_ranking_boost: float
    review_weight_multiplier: float
```

#### Testing Checklist
- [ ] SubscriptionPlan model has `coming_soon` field
- [ ] Pydantic schemas include `coming_soon`
- [ ] MyPy type checking passes (no errors)
- [ ] Can query plan with `plan.coming_soon` without AttributeError
- [ ] Limits docstring renders correctly in IDE

#### Quality Gates
- ✅ MyPy clean (zero errors)
- ✅ Model fields match migration schema
- ✅ Pydantic validation accepts `coming_soon` field
- ✅ TierLimits TypedDict provides autocomplete in IDE

---

### Task 3: Backend API - Extend Subscription Admin Endpoints
**Owner:** Backend  
**Effort:** 2 hours  
**Priority:** P0  
**Depends On:** Task 2 (models updated)

#### Subtasks
1. **Update `POST /admin/subscriptions/plans`** (create plan)
   - Accept `coming_soon` in request body
   - Validate comprehensive limits structure (30+ fields)
   - Log creation in admin audit logs

2. **Update `PATCH /admin/subscriptions/plans/{id}`** (edit plan)
   - Accept `coming_soon` in request body
   - Allow partial limits updates (merge with existing)
   - Log updates in admin audit logs

3. **Create `GET /admin/subscriptions/limits/schema`** (NEW endpoint)
   - Return limit field metadata (name, type, description, default)
   - Group by category (Profile, Operational, Features, Multipliers)
   - Used by frontend to render limit editor dynamically

4. **Add validation**: Prevent assigning Celeb tier if `coming_soon=true`
   - Update `POST /admin/subscriptions/assigned` (assign plan)
   - Check `plan.coming_soon` before assignment
   - Return 400 error: "Cannot assign coming soon tier"

#### Files to Modify
```
backend/app/api/routes/subscription.py
```

#### Code Changes

**backend/app/api/routes/subscription.py**

```python
# ADD new endpoint (after line ~470, before /admin/subscriptions/assigned)
@router.get("/admin/subscriptions/limits/schema")
async def get_limits_schema(
    _admin: str = Depends(require_admin_api_key),
) -> dict:
    """
    Return comprehensive limits schema with metadata.
    Used by admin UI to render limit editor dynamically.
    """
    return {
        "profile_limits": {
            "certificates_limit": {
                "type": "integer",
                "description": "Maximum verified certifications",
                "defaults": {"free": 3, "pro": 10, "elite": 25, "celeb": 9999},
            },
            "languages_limit": {
                "type": "integer",
                "description": "Maximum languages offered",
                "defaults": {"free": 2, "pro": 5, "elite": 10, "celeb": 9999},
            },
            "education_items_limit": {
                "type": "integer",
                "description": "Maximum education entries",
                "defaults": {"free": 2, "pro": 5, "elite": 10, "celeb": 9999},
            },
            "expertise_areas_limit": {
                "type": "integer",
                "description": "Maximum expertise tags",
                "defaults": {"free": 3, "pro": 10, "elite": 20, "celeb": 9999},
            },
            "approaches_limit": {
                "type": "integer",
                "description": "Maximum therapeutic approaches",
                "defaults": {"free": 2, "pro": 5, "elite": 10, "celeb": 9999},
            },
            "subcategories_limit": {
                "type": "integer",
                "description": "Maximum service subcategories",
                "defaults": {"free": 2, "pro": 5, "elite": 10, "celeb": 9999},
            },
            "gallery_items_limit": {
                "type": "integer",
                "description": "Maximum gallery photos/videos",
                "defaults": {"free": 5, "pro": 20, "elite": 50, "celeb": 9999},
            },
            "booking_questions_limit": {
                "type": "integer",
                "description": "Maximum custom booking questions",
                "defaults": {"free": 0, "pro": 3, "elite": 10, "celeb": 9999},
            },
        },
        "operational_limits": {
            "services_limit": {
                "type": "integer",
                "description": "Maximum active service offerings",
                "defaults": {"free": 2, "pro": 5, "elite": 15, "celeb": 9999},
            },
            "booking_slots_limit": {
                "type": "integer",
                "description": "Maximum availability slots per month",
                "defaults": {"free": 10, "pro": 50, "elite": 200, "celeb": 9999},
            },
            "client_invites_per_day": {
                "type": "integer",
                "description": "Maximum client invites per day",
                "defaults": {"free": 1, "pro": 5, "elite": 20, "celeb": 9999},
            },
            "client_invites_per_month": {
                "type": "integer",
                "description": "Maximum client invites per month",
                "defaults": {"free": 5, "pro": 30, "elite": 100, "celeb": 9999},
            },
            "leads_per_day": {
                "type": "integer",
                "description": "Maximum new leads accepted per day",
                "defaults": {"free": 2, "pro": 10, "elite": 50, "celeb": 9999},
            },
            "leads_total_limit": {
                "type": "integer",
                "description": "Maximum total active leads",
                "defaults": {"free": 10, "pro": 50, "elite": 200, "celeb": 9999},
            },
            "followups_per_day": {
                "type": "integer",
                "description": "Maximum follow-ups created per day",
                "defaults": {"free": 3, "pro": 20, "elite": 100, "celeb": 9999},
            },
            "followups_total_limit": {
                "type": "integer",
                "description": "Maximum active follow-ups",
                "defaults": {"free": 20, "pro": 100, "elite": 500, "celeb": 9999},
            },
            "routines_limit": {
                "type": "integer",
                "description": "Maximum active client routines",
                "defaults": {"free": 0, "pro": 10, "elite": 50, "celeb": 9999},
            },
            "routine_templates_limit": {
                "type": "integer",
                "description": "Maximum reusable routine templates",
                "defaults": {"free": 0, "pro": 5, "elite": 25, "celeb": 9999},
            },
            "group_classes_limit": {
                "type": "integer",
                "description": "Maximum active group classes",
                "defaults": {"free": 0, "pro": 3, "elite": 15, "celeb": 9999},
            },
            "activity_manager_yet_to_start_cap": {
                "type": "integer",
                "description": "Maximum 'yet to start' items in activity manager",
                "defaults": {"free": 10, "pro": 30, "elite": 100, "celeb": 9999},
            },
            "activity_manager_in_progress_cap": {
                "type": "integer",
                "description": "Maximum 'in progress' items in activity manager",
                "defaults": {"free": 10, "pro": 30, "elite": 100, "celeb": 9999},
            },
            "classes_sessions_limit": {
                "type": "integer",
                "description": "Maximum total classes/sessions",
                "defaults": {"free": 5, "pro": 25, "elite": 100, "celeb": 9999},
            },
            "messages_retention_days": {
                "type": "integer",
                "description": "Chat history retention period (days)",
                "defaults": {"free": 30, "pro": 90, "elite": 365, "celeb": 9999},
            },
        },
        "feature_flags": {
            "can_reply_to_reviews": {
                "type": "boolean",
                "description": "Can respond to client reviews",
                "defaults": {"free": True, "pro": True, "elite": True, "celeb": True},
            },
            "can_receive_reviews": {
                "type": "boolean",
                "description": "Can receive client reviews",
                "defaults": {"free": True, "pro": True, "elite": True, "celeb": True},
            },
            "featured_in_search": {
                "type": "boolean",
                "description": "Boosted search ranking",
                "defaults": {"free": False, "pro": True, "elite": True, "celeb": True},
            },
            "priority_support": {
                "type": "boolean",
                "description": "Access to priority customer support",
                "defaults": {"free": False, "pro": False, "elite": True, "celeb": True},
            },
            "ai_routine_privacy": {
                "type": "boolean",
                "description": "AI cannot read routines for suggestions",
                "defaults": {"free": False, "pro": False, "elite": False, "celeb": True},
            },
            "white_label_branding": {
                "type": "boolean",
                "description": "Custom branding on client-facing pages",
                "defaults": {"free": False, "pro": False, "elite": False, "celeb": True},
            },
            "dedicated_account_manager": {
                "type": "boolean",
                "description": "Personal account manager",
                "defaults": {"free": False, "pro": False, "elite": False, "celeb": True},
            },
            "brand_collaboration_priority": {
                "type": "boolean",
                "description": "Priority brand partnership access",
                "defaults": {"free": False, "pro": False, "elite": True, "celeb": True},
            },
        },
        "multipliers": {
            "coin_multiplier": {
                "type": "float",
                "description": "Coin earn rate multiplier",
                "defaults": {"free": 1.0, "pro": 1.5, "elite": 2.0, "celeb": 3.0},
            },
            "search_ranking_boost": {
                "type": "float",
                "description": "Search result ranking boost",
                "defaults": {"free": 1.0, "pro": 1.25, "elite": 1.75, "celeb": 2.5},
            },
            "review_weight_multiplier": {
                "type": "float",
                "description": "Review credibility weight",
                "defaults": {"free": 1.0, "pro": 1.1, "elite": 1.3, "celeb": 1.5},
            },
        },
    }


# UPDATE POST /admin/subscriptions/assigned (add validation, around line 480)
@router.post("/admin/subscriptions/assigned")
async def admin_assign_subscription(
    assignment: ProfessionalSubscriptionAssign,
    db: AsyncSession = Depends(get_db_session),
    admin_key: str = Depends(require_admin_api_key),
) -> ProfessionalSubscriptionOut:
    """Assign a subscription plan to a professional (admin only)."""
    # Fetch plan to check if coming_soon
    stmt_plan = select(SubscriptionPlan).where(SubscriptionPlan.id == assignment.plan_id)
    result_plan = await db.execute(stmt_plan)
    plan = result_plan.scalar_one_or_none()
    if not plan:
        raise HTTPException(404, "Subscription plan not found")
    
    # NEW: Prevent assigning coming_soon tiers
    if plan.coming_soon:
        raise HTTPException(
            400,
            detail=f"Cannot assign '{plan.tier}' tier - marked as coming soon. Remove 'coming_soon' flag first.",
        )
    
    # ... rest of existing logic
```

#### Testing Checklist
- [ ] `GET /admin/subscriptions/limits/schema` returns 30+ limit definitions
- [ ] `POST /admin/subscriptions/plans` accepts `coming_soon` field
- [ ] `PATCH /admin/subscriptions/plans/{id}` updates `coming_soon` field
- [ ] Cannot assign Celeb tier if `coming_soon=true` (400 error)
- [ ] Audit logs record plan creation/updates
- [ ] Response schemas include `coming_soon` field

#### Quality Gates
- ✅ All endpoints return proper HTTP status codes
- ✅ Validation errors return structured JSON
- ✅ Audit logs contain admin_user_id and action details
- ✅ API docs auto-updated (FastAPI schema generation)

---

### Task 4: Admin Frontend - Enhanced Tier Configuration UI
**Owner:** Frontend (wolistic-admin)  
**Effort:** 4 hours  
**Priority:** P0  
**Depends On:** Task 3 (API endpoints ready)

#### Subtasks
1. **Fetch limits schema on mount**
   - Call `GET /admin/subscriptions/limits/schema`
   - Store in component state for dynamic form rendering

2. **Create multi-tab limit editor**
   - Tab 1: Profile Limits (8 fields)
   - Tab 2: Operational Limits (15 fields)
   - Tab 3: Feature Flags (8 fields)
   - Tab 4: Multipliers (3 fields)

3. **Add tier preset dropdown**
   - Options: "Free Tier Defaults", "Pro Tier Defaults", "Elite Tier Defaults", "Celeb Tier Defaults"
   - On select: Auto-fill limits with default values from schema
   - Confirm before overwrite: "Replace current limits with defaults?"

4. **Add visual tier hierarchy**
   - Display: Free → Pro → Elite → Celeb (with arrows)
   - Highlight current tier being edited

5. **Add "Coming Soon" toggle**
   - Checkbox: "Mark this tier as coming soon (not assignable)"
   - Show badge on tier name when enabled

6. **Update TypeScript types**
   - Add `coming_soon: boolean` to `SubscriptionPlan` type
   - Add comprehensive limits types

#### Files to Modify
```
wolistic-admin/app/subscriptions/SubscriptionAdminPanel.tsx
wolistic-admin/types/admin.ts
```

#### Files to Create
```
wolistic-admin/components/subscriptions/TierLimitEditor.tsx (optional sub-component)
wolistic-admin/components/subscriptions/TierPresetDropdown.tsx (optional)
```

#### Code Changes

**wolistic-admin/types/admin.ts**
```typescript
// UPDATE SubscriptionPlan interface (add field)
export interface SubscriptionPlan {
  id: number;
  expert_type: string;
  name: string;
  tier: MembershipTier;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  limits: TierLimits; // ← Type this properly
  display_order: number;
  is_active: boolean;
  coming_soon: boolean; // ← NEW
  created_at: string;
  updated_at: string;
}

// ADD comprehensive limits type
export interface TierLimits {
  // Profile Limits
  certificates_limit?: number;
  languages_limit?: number;
  education_items_limit?: number;
  expertise_areas_limit?: number;
  approaches_limit?: number;
  subcategories_limit?: number;
  gallery_items_limit?: number;
  booking_questions_limit?: number;
  
  // Operational Limits
  services_limit?: number;
  booking_slots_limit?: number;
  client_invites_per_day?: number;
  client_invites_per_month?: number;
  leads_per_day?: number;
  leads_total_limit?: number;
  followups_per_day?: number;
  followups_total_limit?: number;
  routines_limit?: number;
  routine_templates_limit?: number;
  group_classes_limit?: number;
  activity_manager_yet_to_start_cap?: number;
  activity_manager_in_progress_cap?: number;
  classes_sessions_limit?: number;
  messages_retention_days?: number;
  
  // Feature Flags
  can_reply_to_reviews?: boolean;
  can_receive_reviews?: boolean;
  featured_in_search?: boolean;
  priority_support?: boolean;
  ai_routine_privacy?: boolean;
  white_label_branding?: boolean;
  dedicated_account_manager?: boolean;
  brand_collaboration_priority?: boolean;
  
  // Multipliers
  coin_multiplier?: number;
  search_ranking_boost?: number;
  review_weight_multiplier?: number;
  
  // Future
  [key: string]: number | boolean | undefined;
}
```

**wolistic-admin/app/subscriptions/SubscriptionAdminPanel.tsx**
```typescript
// This is a complex change - showing key additions only
// Full implementation will be done during coding

// ADD state for limits schema
const [limitsSchema, setLimitsSchema] = useState<any>(null);

// ADD useEffect to fetch limits schema
useEffect(() => {
  const fetchLimitsSchema = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions/limits/schema');
      const data = await response.json();
      setLimitsSchema(data);
    } catch (error) {
      console.error('Failed to fetch limits schema:', error);
    }
  };
  fetchLimitsSchema();
}, []);

// ADD function to apply tier presets
const applyTierPreset = (tier: 'free' | 'pro' | 'elite' | 'celeb') => {
  if (!limitsSchema) return;
  
  const limits: TierLimits = {};
  
  // Merge defaults from all limit categories
  Object.entries(limitsSchema).forEach(([category, fields]: any) => {
    Object.entries(fields).forEach(([key, meta]: any) => {
      limits[key] = meta.defaults[tier];
    });
  });
  
  setFormData((prev) => ({ ...prev, limits }));
};

// ADD tabbed UI in form (replace single limits JSON editor)
<Tabs defaultValue="profile">
  <TabsList>
    <TabsTrigger value="profile">Profile Limits</TabsTrigger>
    <TabsTrigger value="operational">Operational Limits</TabsTrigger>
    <TabsTrigger value="features">Feature Flags</TabsTrigger>
    <TabsTrigger value="multipliers">Multipliers</TabsTrigger>
  </TabsList>
  
  <TabsContent value="profile">
    {limitsSchema?.profile_limits && 
      Object.entries(limitsSchema.profile_limits).map(([key, meta]: any) => (
        <div key={key} className="mb-4">
          <label className="block text-sm font-medium">
            {meta.description}
          </label>
          <input
            type="number"
            value={formData.limits[key] || meta.defaults.free}
            onChange={(e) => setFormData((prev) => ({
              ...prev,
              limits: { ...prev.limits, [key]: parseInt(e.target.value) },
            }))}
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>
      ))
    }
  </TabsContent>
  
  {/* Similar for other tabs */}
</Tabs>

// ADD coming_soon checkbox
<div className="mb-4">
  <label className="flex items-center">
    <input
      type="checkbox"
      checked={formData.coming_soon || false}
      onChange={(e) => setFormData((prev) => ({ ...prev, coming_soon: e.target.checked }))}
      className="mr-2"
    />
    <span className="text-sm">Mark as Coming Soon (not assignable)</span>
  </label>
</div>

// ADD tier preset dropdown (before form fields)
<div className="mb-6">
  <label className="block text-sm font-medium mb-2">Quick Fill:</label>
  <select
    onChange={(e) => {
      if (e.target.value) {
        if (confirm('Replace current limits with preset defaults?')) {
          applyTierPreset(e.target.value as any);
        }
      }
    }}
    className="block w-full rounded border px-3 py-2"
  >
    <option value="">Select preset...</option>
    <option value="free">Free Tier Defaults</option>
    <option value="pro">Pro Tier Defaults</option>
    <option value="elite">Elite Tier Defaults</option>
    <option value="celeb">Celeb Tier Defaults</option>
  </select>
</div>
```

#### Testing Checklist
- [ ] Limits schema fetches on page load
- [ ] Tabs render all 30+ limit fields correctly
- [ ] Preset dropdown fills limits with correct values
- [ ] "Coming Soon" checkbox toggles properly
- [ ] Form submission includes `coming_soon` field
- [ ] TypeScript autocomplete works for `TierLimits`
- [ ] No console errors on page load
- [ ] Mobile responsive (tabs stack correctly)

#### Quality Gates
- ✅ Zero TypeScript errors (`npm run build` passes)
- ✅ No React key warnings in console
- ✅ Form validation prevents negative numbers
- ✅ All limit fields have labels with descriptions
- ✅ Preset confirmation prevents accidental overwrites

---

### Task 5: Seed Script - Create 4 Default Tier Plans
**Owner:** Backend  
**Effort:** 1 hour  
**Priority:** P1  
**Depends On:** Task 1-3 (migration + models + API ready)

#### Subtasks
1. **Create seed script** (`backend/scripts/create_default_tier_plans.py`)
   - Define 4 tier configurations (Free, Pro, Elite, Celeb)
   - Use comprehensive limits from session plan doc
   - Insert into `subscription_plans` table
   - Mark Celeb as `coming_soon=true`

2. **Make script idempotent**
   - Check if tier already exists (by `expert_type + tier`)
   - Skip if exists, insert if missing
   - Return summary: "Created X plans, skipped Y existing"

3. **Add CLI wrapper**
   - `docker exec backend python scripts/create_default_tier_plans.py`
   - Confirm before insert: "Create 4 subscription plans? [y/N]"

#### Files to Create
```
backend/scripts/create_default_tier_plans.py
```

#### Code Template

**backend/scripts/create_default_tier_plans.py**
```python
"""
Create 4 default subscription tier plans (Free, Pro, Elite, Celeb).
Idempotent: Only creates plans that don't exist.

Usage:
  docker exec backend python scripts/create_default_tier_plans.py
"""
import asyncio
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session_local
from app.models.subscription import SubscriptionPlan


async def create_default_plans():
    """Create 4 default tier plans."""
    async with get_async_session_local() as db:
        plans_to_create = [
            {
                "expert_type": "all",
                "name": "Free",
                "tier": "free",
                "description": "Perfect for getting started on Wolistic",
                "price_monthly": 0,
                "price_yearly": 0,
                "display_order": 0,
                "is_active": True,
                "coming_soon": False,
                "features": ["basic_profile", "search_listing", "booking_system", "messaging", "reviews"],
                "limits": {
                    # Profile Limits
                    "certificates_limit": 3,
                    "languages_limit": 2,
                    "education_items_limit": 2,
                    "expertise_areas_limit": 3,
                    "approaches_limit": 2,
                    "subcategories_limit": 2,
                    "gallery_items_limit": 5,
                    "booking_questions_limit": 0,
                    # Operational Limits
                    "services_limit": 2,
                    "booking_slots_limit": 10,
                    "client_invites_per_day": 1,
                    "client_invites_per_month": 5,
                    "leads_per_day": 2,
                    "leads_total_limit": 10,
                    "followups_per_day": 3,
                    "followups_total_limit": 20,
                    "routines_limit": 0,
                    "routine_templates_limit": 0,
                    "group_classes_limit": 0,
                    "activity_manager_yet_to_start_cap": 10,
                    "activity_manager_in_progress_cap": 10,
                    "classes_sessions_limit": 5,
                    "messages_retention_days": 30,
                    # Feature Flags
                    "can_reply_to_reviews": True,
                    "can_receive_reviews": True,
                    "featured_in_search": False,
                    "priority_support": False,
                    # Multipliers
                    "coin_multiplier": 1.0,
                    "search_ranking_boost": 1.0,
                    "review_weight_multiplier": 1.0,
                },
            },
            {
                "expert_type": "all",
                "name": "Pro",
                "tier": "pro",
                "description": "For serious professionals ready to scale their practice",
                "price_monthly": 999,
                "price_yearly": 9999,
                "display_order": 1,
                "is_active": True,
                "coming_soon": False,
                "features": [
                    "everything_in_free",
                    "client_manager",
                    "routine_builder",
                    "analytics",
                    "search_boost",
                    "review_responses",
                ],
                "limits": {
                    # Profile Limits
                    "certificates_limit": 10,
                    "languages_limit": 5,
                    "education_items_limit": 5,
                    "expertise_areas_limit": 10,
                    "approaches_limit": 5,
                    "subcategories_limit": 5,
                    "gallery_items_limit": 20,
                    "booking_questions_limit": 3,
                    # Operational Limits
                    "services_limit": 5,
                    "booking_slots_limit": 50,
                    "client_invites_per_day": 5,
                    "client_invites_per_month": 30,
                    "leads_per_day": 10,
                    "leads_total_limit": 50,
                    "followups_per_day": 20,
                    "followups_total_limit": 100,
                    "routines_limit": 10,
                    "routine_templates_limit": 5,
                    "group_classes_limit": 3,
                    "activity_manager_yet_to_start_cap": 30,
                    "activity_manager_in_progress_cap": 30,
                    "classes_sessions_limit": 25,
                    "messages_retention_days": 90,
                    # Feature Flags
                    "can_reply_to_reviews": True,
                    "can_receive_reviews": True,
                    "featured_in_search": True,
                    "priority_support": False,
                    # Multipliers
                    "coin_multiplier": 1.5,
                    "search_ranking_boost": 1.25,
                    "review_weight_multiplier": 1.1,
                },
            },
            {
                "expert_type": "all",
                "name": "Elite",
                "tier": "elite",
                "description": "For high-performing professionals with established practices",
                "price_monthly": 2999,
                "price_yearly": 29999,
                "display_order": 2,
                "is_active": True,
                "coming_soon": False,
                "features": [
                    "everything_in_pro",
                    "advanced_analytics",
                    "template_library",
                    "priority_support",
                    "brand_collaborations",
                    "custom_filters",
                    "client_showcase",
                ],
                "limits": {
                    # Profile Limits
                    "certificates_limit": 25,
                    "languages_limit": 10,
                    "education_items_limit": 10,
                    "expertise_areas_limit": 20,
                    "approaches_limit": 10,
                    "subcategories_limit": 10,
                    "gallery_items_limit": 50,
                    "booking_questions_limit": 10,
                    # Operational Limits
                    "services_limit": 15,
                    "booking_slots_limit": 200,
                    "client_invites_per_day": 20,
                    "client_invites_per_month": 100,
                    "leads_per_day": 50,
                    "leads_total_limit": 200,
                    "followups_per_day": 100,
                    "followups_total_limit": 500,
                    "routines_limit": 50,
                    "routine_templates_limit": 25,
                    "group_classes_limit": 15,
                    "activity_manager_yet_to_start_cap": 100,
                    "activity_manager_in_progress_cap": 100,
                    "classes_sessions_limit": 100,
                    "messages_retention_days": 365,
                    # Feature Flags
                    "can_reply_to_reviews": True,
                    "can_receive_reviews": True,
                    "featured_in_search": True,
                    "priority_support": True,
                    "brand_collaboration_priority": True,
                    # Multipliers
                    "coin_multiplier": 2.0,
                    "search_ranking_boost": 1.75,
                    "review_weight_multiplier": 1.3,
                },
            },
            {
                "expert_type": "all",
                "name": "Celeb",
                "tier": "celeb",
                "description": "For influencer-level wellness leaders and celebrity practitioners",
                "price_monthly": None,
                "price_yearly": None,
                "display_order": 3,
                "is_active": False,
                "coming_soon": True,  # Not assignable yet
                "features": [
                    "everything_in_elite",
                    "unlimited_everything",
                    "white_label_branding",
                    "dedicated_account_manager",
                    "ai_privacy",
                    "priority_matchmaking",
                    "team_delegation",
                ],
                "limits": {
                    # All limits set to 9999 (effectively unlimited)
                    "certificates_limit": 9999,
                    "languages_limit": 9999,
                    "education_items_limit": 9999,
                    "expertise_areas_limit": 9999,
                    "approaches_limit": 9999,
                    "subcategories_limit": 9999,
                    "gallery_items_limit": 9999,
                    "booking_questions_limit": 9999,
                    "services_limit": 9999,
                    "booking_slots_limit": 9999,
                    "client_invites_per_day": 9999,
                    "client_invites_per_month": 9999,
                    "leads_per_day": 9999,
                    "leads_total_limit": 9999,
                    "followups_per_day": 9999,
                    "followups_total_limit": 9999,
                    "routines_limit": 9999,
                    "routine_templates_limit": 9999,
                    "group_classes_limit": 9999,
                    "activity_manager_yet_to_start_cap": 9999,
                    "activity_manager_in_progress_cap": 9999,
                    "classes_sessions_limit": 9999,
                    "messages_retention_days": 9999,
                    # Feature Flags
                    "can_reply_to_reviews": True,
                    "can_receive_reviews": True,
                    "featured_in_search": True,
                    "priority_support": True,
                    "ai_routine_privacy": True,
                    "white_label_branding": True,
                    "dedicated_account_manager": True,
                    "brand_collaboration_priority": True,
                    # Multipliers
                    "coin_multiplier": 3.0,
                    "search_ranking_boost": 2.5,
                    "review_weight_multiplier": 1.5,
                    "priority_matchmaking_weight": 5.0,
                },
            },
        ]

        created = 0
        skipped = 0

        for plan_data in plans_to_create:
            # Check if plan already exists
            stmt = select(SubscriptionPlan).where(
                SubscriptionPlan.expert_type == plan_data["expert_type"],
                SubscriptionPlan.tier == plan_data["tier"],
            )
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()

            if existing:
                print(f"⏭️  Plan '{plan_data['name']}' ({plan_data['tier']}) already exists, skipping")
                skipped += 1
            else:
                plan = SubscriptionPlan(**plan_data)
                db.add(plan)
                print(f"✅ Created plan: {plan_data['name']} ({plan_data['tier']})")
                created += 1

        await db.commit()

        print("\n" + "=" * 50)
        print(f"Summary: Created {created} plans, skipped {skipped} existing")
        print("=" * 50)


if __name__ == "__main__":
    # Confirm before running
    print("This will create 4 default subscription tier plans:")
    print("  - Free (tier: free)")
    print("  - Pro (tier: pro)")
    print("  - Elite (tier: elite)")
    print("  - Celeb (tier: celeb, coming_soon=true)")
    print()
    response = input("Proceed? [y/N]: ")
    
    if response.lower() != "y":
        print("Aborted.")
        sys.exit(0)
    
    asyncio.run(create_default_plans())
```

#### Testing Checklist
- [ ] Script runs without errors
- [ ] 4 plans created on first run
- [ ] 0 plans created on second run (idempotent)
- [ ] Celeb plan has `coming_soon=true`, `is_active=false`
- [ ] Free plan has `price_monthly=0`
- [ ] All plans have comprehensive limits (30+ fields)

#### Quality Gates
- ✅ Script is idempotent (safe to run multiple times)
- ✅ Confirmation prompt prevents accidental runs
- ✅ All plans queryable via `SELECT * FROM subscription_plans`
- ✅ No duplicate plans created

---

### Task 6: Data Migration - Auto-Assign Free Tier to Existing Professionals
**Owner:** Backend  
**Effort:** 1 hour  
**Priority:** P1  
**Depends On:** Task 5 (default plans created)

#### Subtasks
1. **Create migration script** (`backend/scripts/migrate_existing_professionals_to_free_tier.py`)
   - Find all professionals without subscription
   - Get Free tier plan ID
   - Insert `professional_subscriptions` record for each
   - Set `subscription_type='admin_upgrade'` (grandfathered)
   - Set `status='active'`, `starts_at=now()`, `ends_at=NULL`

2. **Add safety checks**
   - Verify Free tier plan exists before starting
   - Skip professionals who already have subscriptions
   - Transaction rollback on error (all-or-nothing)

3. **Add dry-run mode**
   - `--dry-run` flag: Show what would be created, don't commit
   - Print: "Would assign Free tier to 237 professionals"

#### Files to Create
```
backend/scripts/migrate_existing_professionals_to_free_tier.py
```

#### Code Template

**backend/scripts/migrate_existing_professionals_to_free_tier.py**
```python
"""
Auto-assign Free tier subscriptions to all professionals without subscriptions.

Usage:
  # Dry run (preview only)
  docker exec backend python scripts/migrate_existing_professionals_to_free_tier.py --dry-run
  
  # Actual migration
  docker exec backend python scripts/migrate_existing_professionals_to_free_tier.py
"""
import argparse
import asyncio
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session_local
from app.models.professional import Professional
from app.models.subscription import ProfessionalSubscription, SubscriptionPlan


async def migrate_to_free_tier(dry_run: bool = False):
    """Assign Free tier to all professionals without subscriptions."""
    async with get_async_session_local() as db:
        # 1. Get Free tier plan
        stmt_plan = select(SubscriptionPlan).where(
            SubscriptionPlan.expert_type == "all",
            SubscriptionPlan.tier == "free",
        )
        result = await db.execute(stmt_plan)
        free_plan = result.scalar_one_or_none()
        
        if not free_plan:
            print("❌ ERROR: Free tier plan not found. Run create_default_tier_plans.py first.")
            return
        
        print(f"✅ Found Free tier plan (ID: {free_plan.id})")
        
        # 2. Get all professionals
        stmt_pros = select(Professional)
        result = await db.execute(stmt_pros)
        all_professionals = result.scalars().all()
        
        print(f"📊 Total professionals in database: {len(all_professionals)}")
        
        # 3. Get professionals with existing subscriptions
        stmt_subs = select(ProfessionalSubscription.professional_id)
        result = await db.execute(stmt_subs)
        existing_sub_ids = {row[0] for row in result.fetchall()}
        
        print(f"📊 Professionals with subscriptions: {len(existing_sub_ids)}")
        
        # 4. Find professionals without subscriptions
        needs_subscription = [
            pro for pro in all_professionals if pro.user_id not in existing_sub_ids
        ]
        
        print(f"📊 Professionals needing Free tier: {len(needs_subscription)}")
        
        if len(needs_subscription) == 0:
            print("✅ No migration needed - all professionals already have subscriptions")
            return
        
        if dry_run:
            print("\n🔍 DRY RUN MODE - No changes will be made")
            print(f"Would assign Free tier to {len(needs_subscription)} professionals:")
            for pro in needs_subscription[:10]:  # Show first 10
                print(f"  - {pro.user_id}")
            if len(needs_subscription) > 10:
                print(f"  ... and {len(needs_subscription) - 10} more")
            return
        
        # 5. Create subscriptions
        print("\n🚀 Creating Free tier subscriptions...")
        created = 0
        
        for pro in needs_subscription:
            subscription = ProfessionalSubscription(
                professional_id=pro.user_id,
                plan_id=free_plan.id,
                status="active",
                starts_at=datetime.now(timezone.utc),
                ends_at=None,
                auto_renew=False,
                subscription_type="admin_upgrade",  # Grandfathered users
            )
            db.add(subscription)
            created += 1
            
            if created % 50 == 0:
                print(f"  ... {created}/{len(needs_subscription)} created")
        
        await db.commit()
        
        print("\n" + "=" * 60)
        print(f"✅ SUCCESS: Assigned Free tier to {created} professionals")
        print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate existing professionals to Free tier")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without committing")
    args = parser.parse_args()
    
    if args.dry_run:
        print("=" * 60)
        print("DRY RUN MODE - Preview Only")
        print("=" * 60)
    else:
        print("=" * 60)
        print("MIGRATION MODE - Will create subscriptions")
        print("=" * 60)
        response = input("Continue? [y/N]: ")
        if response.lower() != "y":
            print("Aborted.")
            exit(0)
    
    asyncio.run(migrate_to_free_tier(dry_run=args.dry_run))
```

#### Testing Checklist
- [ ] Dry run shows correct count of professionals
- [ ] Dry run doesn't create database records
- [ ] Real run creates `professional_subscriptions` records
- [ ] All created subscriptions have `subscription_type='admin_upgrade'`
- [ ] All created subscriptions have `status='active'`
- [ ] Second run creates 0 subscriptions (idempotent)
- [ ] Count before + count created = total professionals

#### Quality Gates
- ✅ Script is idempotent (safe to run multiple times)
- ✅ Transaction safety (all-or-nothing)
- ✅ Dry run mode prevents accidental execution
- ✅ Progress indicator for large datasets (>100 professionals)

---

### Task 7: Comprehensive Testing Suite
**Owner:** QA / Backend  
**Effort:** 3 hours  
**Priority:** P0  
**Depends On:** All tasks 1-6

#### Test Categories

##### 7.1 Unit Tests (Backend)
**File**: `backend/tests/test_subscription_tier_admin.py`

```python
"""Unit tests for subscription tier admin functionality."""
import pytest
from app.models.subscription import SubscriptionPlan


@pytest.mark.asyncio
async def test_subscription_plan_has_coming_soon_field(db_session):
    """Test that SubscriptionPlan model has coming_soon field."""
    plan = SubscriptionPlan(
        expert_type="all",
        name="Test Pro",
        tier="pro",
        price_monthly=999,
        features=[],
        limits={},
        coming_soon=True,
    )
    db_session.add(plan)
    await db_session.commit()
    
    assert plan.coming_soon is True


@pytest.mark.asyncio
async def test_cannot_assign_coming_soon_tier(client, admin_headers, db_session):
    """Test that coming_soon tiers cannot be assigned."""
    # Create coming_soon plan
    plan = SubscriptionPlan(
        expert_type="all",
        name="Celeb",
        tier="celeb",
        price_monthly=None,
        features=[],
        limits={},
        coming_soon=True,
    )
    db_session.add(plan)
    await db_session.commit()
    
    # Try to assign
    response = await client.post(
        "/admin/subscriptions/assigned",
        headers=admin_headers,
        json={
            "professional_id": "some-uuid",
            "plan_id": plan.id,
            "status": "active",
            "starts_at": "2026-04-15T00:00:00Z",
        },
    )
    
    assert response.status_code == 400
    assert "coming soon" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_limits_schema_endpoint_returns_all_categories(client, admin_headers):
    """Test that /admin/subscriptions/limits/schema returns all limit categories."""
    response = await client.get("/admin/subscriptions/limits/schema", headers=admin_headers)
    
    assert response.status_code == 200
    data = response.json()
    
    # Check all categories exist
    assert "profile_limits" in data
    assert "operational_limits" in data
    assert "feature_flags" in data
    assert "multipliers" in data
    
    # Check sample fields
    assert "certificates_limit" in data["profile_limits"]
    assert "services_limit" in data["operational_limits"]
    assert "can_reply_to_reviews" in data["feature_flags"]
    assert "coin_multiplier" in data["multipliers"]


@pytest.mark.asyncio
async def test_tier_constraint_rejects_invalid_tier(db_session):
    """Test that tier constraint rejects invalid values."""
    plan = SubscriptionPlan(
        expert_type="all",
        name="Invalid",
        tier="ultra",  # Invalid tier
        price_monthly=999,
        features=[],
        limits={},
    )
    db_session.add(plan)
    
    with pytest.raises(Exception):  # Should raise constraint violation
        await db_session.commit()
```

##### 7.2 Integration Tests (Backend)
**File**: `backend/tests/test_tier_admin_integration.py`

```python
"""Integration tests for tier admin workflows."""
import pytest


@pytest.mark.asyncio
async def test_create_plan_with_comprehensive_limits(client, admin_headers):
    """Test creating a plan with all 30+ limit fields."""
    response = await client.post(
        "/admin/subscriptions/plans",
        headers=admin_headers,
        json={
            "expert_type": "all",
            "name": "Test Pro",
            "tier": "pro",
            "price_monthly": 999,
            "features": ["client_manager"],
            "coming_soon": False,
            "limits": {
                # Profile limits
                "certificates_limit": 10,
                "languages_limit": 5,
                "education_items_limit": 5,
                "expertise_areas_limit": 10,
                "approaches_limit": 5,
                "subcategories_limit": 5,
                "gallery_items_limit": 20,
                "booking_questions_limit": 3,
                # Operational limits
                "services_limit": 5,
                "booking_slots_limit": 50,
                "client_invites_per_day": 5,
                "client_invites_per_month": 30,
                "leads_per_day": 10,
                "leads_total_limit": 50,
                "followups_per_day": 20,
                "followups_total_limit": 100,
                "routines_limit": 10,
                "routine_templates_limit": 5,
                "group_classes_limit": 3,
                "activity_manager_yet_to_start_cap": 30,
                "activity_manager_in_progress_cap": 30,
                "classes_sessions_limit": 25,
                "messages_retention_days": 90,
                # Feature flags
                "can_reply_to_reviews": True,
                "can_receive_reviews": True,
                "featured_in_search": True,
                "priority_support": False,
                # Multipliers
                "coin_multiplier": 1.5,
                "search_ranking_boost": 1.25,
                "review_weight_multiplier": 1.1,
            },
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["tier"] == "pro"
    assert data["coming_soon"] is False
    assert data["limits"]["services_limit"] == 5
    assert data["limits"]["coin_multiplier"] == 1.5


@pytest.mark.asyncio
async def test_update_plan_limits_preserves_unmodified_fields(client, admin_headers, db_session):
    """Test that PATCH only updates specified limit fields."""
    # Create plan with full limits
    plan = SubscriptionPlan(
        expert_type="all",
        name="Test",
        tier="pro",
        price_monthly=999,
        features=[],
        limits={
            "services_limit": 5,
            "routines_limit": 10,
            "coin_multiplier": 1.5,
        },
    )
    db_session.add(plan)
    await db_session.commit()
    
    # Update only services_limit
    response = await client.patch(
        f"/admin/subscriptions/plans/{plan.id}",
        headers=admin_headers,
        json={
            "limits": {"services_limit": 10},  # Update one field
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check that only services_limit changed
    assert data["limits"]["services_limit"] == 10
    assert data["limits"]["routines_limit"] == 10  # Preserved
    assert data["limits"]["coin_multiplier"] == 1.5  # Preserved
```

##### 7.3 Script Tests
**File**: `backend/tests/test_tier_migration_scripts.py`

```python
"""Tests for tier creation and migration scripts."""
import pytest
from scripts.create_default_tier_plans import create_default_plans
from scripts.migrate_existing_professionals_to_free_tier import migrate_to_free_tier


@pytest.mark.asyncio
async def test_create_default_plans_is_idempotent(db_session):
    """Test that running script twice doesn't create duplicates."""
    # Run once
    await create_default_plans()
    
    from app.models.subscription import SubscriptionPlan
    from sqlalchemy import select, func
    
    stmt = select(func.count(SubscriptionPlan.id))
    result = await db_session.execute(stmt)
    count_after_first = result.scalar()
    
    # Run again
    await create_default_plans()
    
    result = await db_session.execute(stmt)
    count_after_second = result.scalar()
    
    # Count should be the same
    assert count_after_first == count_after_second == 4


@pytest.mark.asyncio
async def test_migrate_professionals_assigns_free_tier(db_session, test_professional):
    """Test that migration assigns Free tier to professionals without subscriptions."""
    # Ensure test_professional has no subscription
    await migrate_to_free_tier(dry_run=False)
    
    from app.models.subscription import ProfessionalSubscription
    from sqlalchemy import select
    
    stmt = select(ProfessionalSubscription).where(
        ProfessionalSubscription.professional_id == test_professional.user_id
    )
    result = await db_session.execute(stmt)
    subscription = result.scalar_one_or_none()
    
    assert subscription is not None
    assert subscription.subscription_type == "admin_upgrade"
    assert subscription.status == "active"
```

##### 7.4 Frontend Tests
**File**: `wolistic-admin/app/subscriptions/__tests__/SubscriptionAdminPanel.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubscriptionAdminPanel from '../SubscriptionAdminPanel';

// Mock fetch
global.fetch = jest.fn();

describe('SubscriptionAdminPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches and displays limits schema on mount', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile_limits: {
          certificates_limit: {
            type: 'integer',
            description: 'Max certifications',
            defaults: { free: 3, pro: 10, elite: 25, celeb: 9999 },
          },
        },
      }),
    });

    render(<SubscriptionAdminPanel />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/subscriptions/limits/schema');
    });
  });

  test('applying tier preset fills limits correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile_limits: {
          services_limit: {
            defaults: { free: 2, pro: 5, elite: 15, celeb: 9999 },
          },
        },
      }),
    });

    render(<SubscriptionAdminPanel />);

    await waitFor(() => screen.getByText(/Select preset/i));

    const presetDropdown = screen.getByRole('combobox');
    fireEvent.change(presetDropdown, { target: { value: 'pro' } });

    // Confirm dialog
    window.confirm = jest.fn(() => true);

    // Check that limits were filled (implementation-specific)
    // This assumes form fields are rendered with data-testid
    await waitFor(() => {
      const servicesInput = screen.getByTestId('services_limit');
      expect(servicesInput).toHaveValue(5);
    });
  });

  test('coming_soon checkbox toggles correctly', async () => {
    render(<SubscriptionAdminPanel />);

    const checkbox = screen.getByLabelText(/Mark as Coming Soon/i);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
```

#### Testing Checklist

**Backend Unit Tests**
- [ ] SubscriptionPlan has `coming_soon` field
- [ ] Cannot assign coming_soon tier (400 error)
- [ ] Limits schema endpoint returns all categories
- [ ] Tier constraint rejects invalid values

**Backend Integration Tests**
- [ ] Create plan with 30+ limits succeeds
- [ ] Update plan preserves unmodified limit fields
- [ ] Audit logs record plan creation/updates
- [ ] Migration scripts are idempotent

**Frontend Tests**
- [ ] Limits schema fetches on mount
- [ ] Tier preset dropdown fills limits
- [ ] Coming soon checkbox toggles
- [ ] Form validation prevents negative numbers

**Manual QA Checklist**
- [ ] Admin can create Free tier plan
- [ ] Admin can create Pro tier plan with all limits
- [ ] Admin can create Celeb tier marked coming_soon
- [ ] Cannot assign Celeb tier to professional
- [ ] Can assign Free tier to professional
- [ ] Audit log shows plan creation with admin user
- [ ] Tier preset dropdown auto-fills all 30+ fields
- [ ] Tab navigation works (Profile → Operational → Features → Multipliers)
- [ ] No console errors on page load
- [ ] Mobile responsive (tabs stack correctly)

#### Quality Gates
- ✅ 100% test coverage on critical paths
- ✅ All unit tests pass (`pytest backend/tests/test_subscription_tier_admin.py`)
- ✅ All integration tests pass
- ✅ Frontend tests pass (`npm test`)
- ✅ MyPy type checking passes (zero errors)
- ✅ No TypeScript errors (`npm run build`)
- ✅ Manual QA checklist 100% complete

---

## 📊 VERIFICATION & VALIDATION

### Pre-Deployment Checklist

**Database**
- [ ] Migration applied successfully (`alembic upgrade head`)
- [ ] Migration reversible (`alembic downgrade -1`, then `upgrade head`)
- [ ] `coming_soon` column exists in `subscription_plans`
- [ ] Tier constraint enforced (try inserting `tier='invalid'` → fails)

**Backend**
- [ ] SubscriptionPlan model has `coming_soon` field
- [ ] Pydantic schemas include `coming_soon`
- [ ] `/admin/subscriptions/limits/schema` returns 30+ fields
- [ ] Cannot assign coming_soon tier (400 error)
- [ ] MyPy passes: `docker exec backend mypy app/api app/core --config-file mypy.ini`
- [ ] All tests pass: `docker exec backend pytest backend/tests/test_subscription_tier_admin.py`

**Scripts**
- [ ] Default tier plans created: `docker exec backend python scripts/create_default_tier_plans.py`
- [ ] 4 plans visible in database: `SELECT * FROM subscription_plans`
- [ ] Professionals migrated: `docker exec backend python scripts/migrate_existing_professionals_to_free_tier.py`
- [ ] Count matches: `SELECT COUNT(*) FROM professionals` = `SELECT COUNT(*) FROM professional_subscriptions`

**Frontend**
- [ ] TypeScript compiles: `cd wolistic-admin && npm run build`
- [ ] No console errors on page load: `npm run dev:admin`
- [ ] Limits schema fetches successfully (check Network tab)
- [ ] All tabs render (Profile, Operational, Features, Multipliers)
- [ ] Tier preset dropdown works (fills limits)
- [ ] Coming soon checkbox toggles
- [ ] Form submission includes `coming_soon` field

**End-to-End Validation**
- [ ] Complete user journey:
  1. Admin opens `/subscriptions` page
  2. Clicks "Create Plan"
  3. Selects "Pro Tier Defaults" from preset dropdown
  4. Verifies all 30+ limits auto-filled
  5. Unchecks "Coming Soon"
  6. Submits form
  7. Plan appears in plans list
  8. Clicks "Assign Subscription"
  9. Assigns Pro tier to test professional
  10. Verifies in database: `SELECT * FROM professional_subscriptions WHERE plan_id = ?`

### Success Metrics

**Phase 1 Completion Criteria**
- ✅ 4 subscription plans exist (Free, Pro, Elite, Celeb)
- ✅ 100% of professionals have subscriptions (all Free tier)
- ✅ 0 subscription assignment errors in logs
- ✅ Celeb tier is coming_soon=true, not assignable
- ✅ Admin can edit any limit field in UI
- ✅ All limit changes tracked in audit_logs
- ✅ Zero TypeScript errors, zero MyPy errors
- ✅ 100% test coverage on critical paths

**Performance**
- ✅ Limits schema endpoint <100ms response time
- ✅ Create plan endpoint <500ms response time
- ✅ Migration script completes in <30 seconds for 1000 professionals

**Quality**
- ✅ Zero production errors in first 48 hours
- ✅ Zero data corruption incidents
- ✅ Zero audit log gaps (all edits tracked)

---

## 🚨 RISK MITIGATION

### Risk: Migration Script Fails Mid-Execution
**Impact**: Some professionals assigned Free tier, others not (inconsistent state)  
**Mitigation**:
- Transaction safety: All-or-nothing commit
- Dry run mode: Test before real execution
- Idempotent: Safe to re-run if fails

### Risk: Celeb Tier Accidentally Assigned
**Impact**: Professional gets unlimited limits before tier is ready  
**Mitigation**:
- API validation: 400 error if `plan.coming_soon=true`
- UI disabled state: Celeb tier shows "Coming Soon" badge
- Audit logs: Track all tier assignments with admin user ID

### Risk: Limits Schema Out of Sync
**Impact**: Frontend shows different limits than backend enforces  
**Mitigation**:
- Single source of truth: `/admin/subscriptions/limits/schema` endpoint
- Dynamic rendering: Frontend fetches schema on mount
- TypeScript types: TierLimits interface enforces structure

### Risk: Tier Constraint Migration Fails
**Impact**: Database allows invalid tiers (e.g., "ultra")  
**Mitigation**:
- Test migration in local/staging first
- Rollback plan: Downgrade migration if fails
- Constraint documented in migration docstring

---

## 📝 DOCUMENTATION REQUIREMENTS

### Code Documentation
- [ ] Migration file has comprehensive docstring
- [ ] SubscriptionPlan model docstring lists all 30+ limits
- [ ] TierLimits TypedDict has field descriptions
- [ ] Scripts have usage examples in docstrings

### API Documentation
- [ ] `/admin/subscriptions/limits/schema` documented in OpenAPI/Swagger
- [ ] Updated Pydantic schemas auto-generate API docs
- [ ] Example requests/responses for create/update plan

### Runbook
- [ ] Document deployment sequence:
  1. Apply migration
  2. Run default tier plans script
  3. Run professional migration script
  4. Deploy backend
  5. Deploy admin dashboard
- [ ] Document rollback procedure
- [ ] Document verification steps

---

## 🎯 DONE CRITERIA

**Phase 1 is COMPLETE when**:
- ✅ All 7 tasks implemented and tested
- ✅ 100% of verification checklist items pass
- ✅ Zero failing tests (backend + frontend)
- ✅ Zero MyPy errors, zero TypeScript errors
- ✅ Documentation complete and reviewed
- ✅ Deployed to staging and manually tested
- ✅ CTO/Senior PM sign-off obtained

**Ready for Phase 2 when**:
- ✅ Phase 1 running in production for 48+ hours with zero errors
- ✅ All professionals successfully migrated to Free tier
- ✅ Admin successfully created/edited 2+ plans
- ✅ Audit logs confirm all tier changes tracked

---

## 📅 TIMELINE ESTIMATE

| Task | Effort | Dependencies | Can Parallelize? |
|------|--------|--------------|------------------|
| Task 1: Migration | 2h | None | No |
| Task 2: Models | 2h | Task 1 | No |
| Task 3: API | 2h | Task 2 | No |
| Task 4: Frontend | 4h | Task 3 | No |
| Task 5: Seed Script | 1h | Tasks 1-3 | With Task 4 |
| Task 6: Data Migration | 1h | Task 5 | With Task 4 |
| Task 7: Testing | 3h | All | After all |

**Sequential Path**: 15 hours (2 days)  
**With Parallelization**: 12 hours (1.5 days)  
**Buffer (20%)**: +3 hours  
**Total**: **15-18 hours (2-3 days)**

---

**Document Status**: ✅ Ready for Engineering Review  
**Next Steps**: CTO/Senior PM approval → Begin Task 1 (Database Migration)
