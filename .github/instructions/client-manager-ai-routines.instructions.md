---
description: "Use when implementing Client Manager feature, AI-powered routine generation, expert-client relationship management, routine approval workflows, performance tracking, client acquisition channels, follow-up management, session/class tracking, or discussing client management architecture. Covers schema design, service boundaries, phasing strategy, AI integration patterns, multi-channel client onboarding, and quality gates for expert-generated vs AI-assisted content."
name: "Client Manager & AI Routine Generation"
---

# Client Manager & AI Routine Generation

## V2 Dashboard Integration

**Location**: `frontend/components/dashboard/elite/ClientsManagerV2Page.tsx`  
**Shell**: Integrated into `EliteBodyExpertShell` (v2 partner dashboard)  
**Navigation**: Accessible via "Client Manager" in `EliteSideNav` alongside Activity Manager, Profile Studio  
**Current State**: ✅ **FULLY IMPLEMENTED** - All 4 stages complete with mock data (April 2026)  
**Enhancement Status**: New v2 implementation replaces basic client list; renders when `currentPage === "clients"`  

### Quick Reference: Implementation Status

| Component | Status | Description |
|-----------|--------|-------------|
| **ClientsManagerV2Page.tsx** | ✅ **LIVE IN DASHBOARD** | Complete UI with 4 stages, tabs, filters, mock data |
| **Client List View** | ✅ COMPLETE | Metrics, cards grid, filters, source badges |
| **Client Detail Sheet** | ✅ COMPLETE | Hero routine section, sessions, follow-ups, performance |
| **Routine Editor Modal** | ✅ COMPLETE | Full CRUD with 6 item types, publish workflow |
| **Reusable Components** | ✅ COMPLETE | 15+ components (badges, progress, empty states) |
| **Mock Data** | ✅ COMPLETE | 5 clients, 3 routines, realistic wellness scenarios |
| **Backend Integration** | 🔜 NEXT PHASE | Ready for API wiring (routes defined in spec) |
| **AI Routine Generation** | 🔜 PHASE 2 | After Phase 1 validation (LLM integration) |

**Navigation Path**: Dashboard → Left Sidebar → "Client Manager" → Full v2 UI loads

**Old vs New**:
- Old: Basic `ClientsManagerPage` (3 tabs: Clients, Follow-ups, Leads) - **preserved, not deleted**
- New: `ClientsManagerV2Page` (4 tabs + hero routine section + advanced features) - **now active in dashboard**

---

## Feature Vision

**Problem**: Wellness experts (trainers, nutritionists, coaches) managing 10+ clients face multiple pain points:
- Excessive time creating personalized routines manually (15+ min per routine)
- Tracking performance, follow-ups, and sessions across spreadsheets
- Managing clients from different acquisition sources (direct invites, platform discovery, corporate events, Wolistic recommendations)
- No unified system for client lifecycle management (lead → client → ongoing engagement)

**Solution**: Enhanced Client Manager that centralizes all expert-client interactions:
- **Client Acquisition**: Multi-channel onboarding tracking (expert invites, organic discovery, corporate events, Wolistic team recommendations, leads)
- **Follow-Up Management**: ✅ EXISTING — Track communication, next actions, client engagement via `expert_client_followups`
- **Session/Class Management**: ✅ EXISTING — View bookings via `ClassesManagerPage` integration
- **Routine/Plan Management**: 🆕 NEW — Create, assign, track personalized programs with AI assistance
- **AI-Powered Generation**: 🆕 PHASE 2 — AI drafts routines, experts review/approve before publishing

**Critical constraint**: No AI-generated content reaches clients without explicit expert approval.

**Business Impact**:
- Reduce routine creation time from 15min → <7min (AI-assisted)
- Enable experts to scale from 5 clients → 15+ clients
- Unified client management vs. fragmented tools (Trainerize $99-299/mo)
- Multi-channel acquisition tracking enables better attribution and pricing strategies
- First-mover advantage: Competitors lack AI-assisted generation as of Q2 2026

---

## Strategic Context

### Product Positioning by Tier

| Tier | Client Manager Access | AI Generation Quota | Rationale |
|------|----------------------|---------------------|-----------|
| **Free** | ❌ None | N/A | Discovery + basic bookings only |
| **Pro** | ✅ Up to 10 clients | 20/month | "Scale your practice" — core value prop |
| **Elite** | ✅ Up to 50 clients | Unlimited | Advanced analytics + template library (Phase 2) |
| **Celeb** | ✅ Unlimited | Unlimited | Team delegation, white-label branding |

### Phasing Strategy

**Phase 1 — Enhanced Client Management + Manual Routines (6-8 weeks)**
- Goal: Enhance existing ClientsManagerPage with source tracking and routine management
- **Foundation (✅ EXISTING)**:
  - `ClientsManagerPage.tsx` component with 3 tabs (Clients, Follow-ups, Leads)
  - `/api/v1/partners/me/clients` and `/me/clients-board` API endpoints
  - Database tables: `expert_clients`, `expert_client_followups`, `expert_leads`
  - Basic CRUD: Create/edit/delete clients, follow-ups, leads
- **Phase 1A Enhancements (2-3 weeks, NEW work)**:
  - Multi-channel source tracking: Add `acquisition_source`, `source_metadata`, `corporate_event_id`, `discount_code` to `expert_clients`
  - Enhanced dashboard: Unified view aggregating clients + follow-ups + sessions + routines
  - Source analytics: Filter by acquisition channel, track conversion rates
- **Phase 1B Routine Management (4-5 weeks, NEW work)**:
  - Manual routine builder: Create/edit routines with exercises/meals
  - Routine assignment: Publish routines to specific clients
  - Client check-ins: Clients log progress via mobile-friendly form
  - Expert feedback: Review check-ins, provide guidance
  - Schema: `routines`, `routine_items`, `routine_check_ins`, `routine_expert_feedback` tables
- Success Metric: 50+ Pro trainers adopt, 5+ routines published per trainer/month
- Kill Criteria: <30% use it more than once

**Phase 2 — AI-Assisted Routine Generation (If Phase 1 succeeds)**
- Goal: Reduce expert time 6x via AI drafting + expert review
- Scope:
  - Async AI generation (LLM integration, job queue)
  - Expert approval gate (review, edit, approve AI drafts)
  - Side-by-side review UI
  - Routine template library
  - Lead scoring and conversion tracking (optional)
- Success Metric: 70%+ AI acceptance rate, time-to-publish <7min, zero quality complaints
- Requires: LLM provider decision (OpenAI GPT-4 or Anthropic Claude), job queue infra (Arq + Redis)

**Phase 3 — Advanced Analytics & Automation (Scale)**
- Scope:
  - Progress trends and predictive analytics
  - Automated client health checks (flag clients falling behind)
  - Wearable integrations (Fitbit, Apple Health)
  - Advanced lead management (automated nurture workflows)
  - Corporate event attribution and ROI tracking
- Elite-exclusive features to justify pricing tier

---

## Client Acquisition Sources & Data Model

Wolistic supports **multi-channel client acquisition** — experts can build their practice through various pathways, each with different data requirements and pricing implications.

### Client Acquisition Channels

| Source | Description | Data Requirements | Pricing Implications |
|--------|-------------|-------------------|----------------------|
| **Expert-Invited** | Expert directly invites client via email/link | Invitation record, invited_by professional_id | Standard pricing |
| **Organic Discovery** | Client finds expert via Wolistic search/browse | Search query, referral source (search/featured/category) | Standard pricing |
| **Corporate Event** | Client acquired through corporate wellness event | `corporate_event_id`, employee verification, discount code | Corporate discount pricing |
| **Wolistic Team Recommendation** | Platform recommends 3 experts to client based on intake | Recommendation algorithm metadata, why recommended | Standard pricing, recommendation tracking |
| **Lead from Wolistic** | Client expressed interest but hasn't booked yet | Lead source, intake form responses, lead score | Nurture workflow, no pricing until conversion |

### Schema Extensions for Client Source Tracking

**Existing Table**: `expert_clients` (already has basic client-expert relationship)

**Required Additions** (new migration):
```sql
ALTER TABLE expert_clients ADD COLUMN IF NOT EXISTS acquisition_source VARCHAR(64);
ALTER TABLE expert_clients ADD COLUMN IF NOT EXISTS source_metadata JSONB;
ALTER TABLE expert_clients ADD COLUMN IF NOT EXISTS corporate_event_id BIGINT REFERENCES corporate_events(id);
ALTER TABLE expert_clients ADD COLUMN IF NOT EXISTS discount_code VARCHAR(64);
ALTER TABLE expert_clients ADD COLUMN IF NOT EXISTS is_lead BOOLEAN DEFAULT FALSE;
ALTER TABLE expert_clients ADD COLUMN IF NOT EXISTS lead_score INT;
ALTER TABLE expert_clients ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

CREATE INDEX idx_expert_clients_acquisition_source ON expert_clients(acquisition_source);
CREATE INDEX idx_expert_clients_corporate_event ON expert_clients(corporate_event_id) WHERE corporate_event_id IS NOT NULL;
CREATE INDEX idx_expert_clients_is_lead ON expert_clients(is_lead) WHERE is_lead = TRUE;
```

**Field Definitions**:
- `acquisition_source`: Enum-like varchar — `expert_invite`, `organic_search`, `corporate_event`, `wolistic_recommendation`, `wolistic_lead`
- `source_metadata`: JSON storing channel-specific context:
  - **Expert-invited**: `{"invitation_sent_at": "2026-04-01T10:00:00Z", "invitation_accepted_at": "..."}`
  - **Organic discovery**: `{"search_query": "yoga instructor near me", "referrer_url": "/search/yoga"}`
  - **Corporate event**: `{"event_name": "TechCorp Wellness Week", "employee_id": "EMP12345"}`
  - **Wolistic recommendation**: `{"recommended_experts": [uuid1, uuid2, uuid3], "recommendation_reason": "specialized in prenatal yoga"}`
  - **Lead**: `{"lead_source": "landing_page_form", "intake_responses": {...}}`
- `corporate_event_id`: Foreign key to `corporate_events` table (for event-based pricing)
- `discount_code`: If client has special pricing (corporate discount, promo code)
- `is_lead`: TRUE if client hasn't converted to active client yet (no booking/payment)
- `lead_score`: 0-100 score for lead prioritization (optional, Phase 2)
- `converted_at`: Timestamp when lead → active client (first booking confirmed)

### Wolistic Team Recommendation Flow (3 Experts)

**Use Case**: User submits intake form → Wolistic algorithm recommends 3 best-matched experts → user books with one.

**Workflow**:
```
1. User fills out intake form (goals, location, preferences, budget)
2. Wolistic recommendation engine runs:
   - Considers: specialty match, location proximity, availability, tier, reviews
   - Returns: 3 expert UUIDs ranked by fit score
3. User sees "Recommended For You" card with 3 experts
4. User selects Expert B, books session
5. Backend creates `expert_clients` record:
   - `acquisition_source = 'wolistic_recommendation'`
   - `source_metadata = {
       "recommended_experts": [expertA_uuid, expertB_uuid, expertC_uuid],
       "selected_expert": expertB_uuid,
       "recommendation_reason": "Specialized in prenatal yoga, 5-star reviews, <5mi from you",
       "intake_form_id": 12345
     }`
6. Expert B's dashboard shows: "Client from Wolistic Recommendation" badge
```

**Why Track This**:
- **Attribution**: Measure recommendation engine quality (did user pick #1, #2, or #3 expert?)
- **Personalization**: Expert knows client came via platform match (not cold lead)
- **Analytics**: Track which expert attributes drive conversions (location? price? reviews?)

**UI Implications**:
- Client list shows "Recommended by Wolistic" badge
- Client detail shows why they were matched (e.g., "Matched for: Prenatal yoga, budget-friendly")

### Existing Features (Already Built)

The Client Manager integrates with **existing Wolistic features** — do NOT rebuild these, just reference them:

| Feature | Location | Status | Integration Point |
|---------|----------|--------|-------------------|
| **Follow-Ups** | `expert_client_followups` table | ✅ Live | Display in client detail view, create/edit follow-up actions |
| **Sessions/Classes** | Booking system (`bookings`, `classes` tables) | ✅ Live | List client's booked sessions, links to calendar |
| **Client CRUD** | `/api/v1/partners/me/clients` | ✅ Live | Add/edit client profile, archive, notes |
| **Client Messaging** | Messaging service | ✅ Live | Send messages to clients, conversation history |

**Implementation Note**: Client Manager UI should **aggregate** these existing features into a unified dashboard, not reimplement them. For example:
- Client detail page shows: Profile + Follow-ups + Sessions + Routines (new) + Messages
- Routines are the NEW component being built in this instructions file
- Follow-ups, sessions, messages already have backend services — just wire up frontend display

---

## Architecture Principles

### 1. Modularity: Routines as Independent Vertical Slice

**Treat routines like coins**: First-class subsystem with own lifecycle, NOT tightly coupled to bookings/messaging.

```
✅ GOOD: Booking completion triggers "create routine" suggestion → expert initiates routine creation
❌ BAD: Booking record embeds routine data, violates separation of concerns

✅ GOOD: Routine published → notification service sends alert to client
❌ BAD: Routine service directly calls messaging API, creates dependency
```

### 2. Service Boundaries

**New Module**: `backend/app/services/routines/`

```
routines/
├── __init__.py              # Public service API
├── service.py               # Core routine CRUD, approval workflow
├── ai_generator.py          # AI recommendation generation (Phase 2)
├── performance.py           # Aggregated check-in metrics (Phase 2/3)
└── templates.py             # Routine templates library (Phase 2/3)
```

**Integration Rules**:
- **Bookings**: No direct dependency. Booking events may *suggest* routine creation via dashboard CTA.
- **Messaging**: Routines emit events (e.g., "routine_published"), messaging service listens and sends notifications.
- **Coins**: Coin service awards coins for routine milestones (e.g., client 4-week streak). Routines do NOT call coin APIs directly.
- **Notifications**: Similar to messaging — event-driven, not direct calls.
- **Pricing/Payments**: When corporate event clients book, payment service checks `expert_clients.corporate_event_id` and applies corporate discount. Client Manager does NOT calculate pricing — just stores the relationship.

### 3. Corporate Event Pricing Integration

**Use Case**: Client acquired through corporate wellness event receives special pricing on bookings.

**Data Flow**:
```
1. Corporate event created → `corporate_events` table (event name, employer, discount %)
2. Client signs up via event link → `expert_clients` record created with:
   - `acquisition_source = 'corporate_event'`
   - `corporate_event_id = {event_id}`
   - `discount_code = 'TECHCORP2026'` (optional)
   - `source_metadata = {"event_name": "TechCorp Wellness Week", "employee_id": "..."}`
3. Client books session → Payment service queries:
   - `SELECT discount_code, corporate_event_id FROM expert_clients WHERE user_id = {client_id}`
   - Applies corporate discount rate from `corporate_events.discount_percentage`
4. Expert views client roster → UI displays "Corporate Event" badge, links to event details
```

**Pricing Enforcement** (NOT in Client Manager scope):
- Payment/booking service owns pricing calculation
- Client Manager only stores `corporate_event_id` and `discount_code` as metadata
- Pricing service queries this data when calculating session cost

**UI Implications**:
- Client list shows visual indicator: "Corporate Event" badge
- Client detail shows event name, employer, discount eligibility
- Routine creation for corporate clients is same workflow (no special logic)

### 4. Lead Management & Conversion Tracking

**Lead Definition**: User who expressed interest in an expert but hasn't completed a booking/payment yet.

**Lead Sources**:
- Wolistic landing page form (user submits intake, requests expert match)
- Expert invite sent but not accepted yet
- Corporate event registration but no booking confirmed
- Organic search (user saved expert but didn't book)

**Data Model**:
```sql
-- expert_clients table with is_lead flag
is_lead = TRUE  → Lead (not yet converted)
is_lead = FALSE → Active client (has booked at least once)

-- Conversion tracking
converted_at = NULL  → Still a lead
converted_at = timestamp → Became client on this date (first booking confirmed)
```

**Workflow**:
```
1. Lead created → `expert_clients` with `is_lead = TRUE`, `lead_score = {0-100}`
2. Expert views leads → Dashboard shows separate "Leads" section, sorted by score
3. Expert nurtures lead → Sends message, creates follow-up reminder
4. Lead books session → Booking service updates:
   - `is_lead = FALSE`
   - `converted_at = NOW()`
5. Analytics → Track conversion rate by `acquisition_source`
```

**Phase 1 Scope**: Store `is_lead` flag, display leads separately in UI (simple list, no scoring)  
**Phase 2 Scope**: Lead scoring algorithm, automated nurture workflows, conversion analytics

---

## Schema Design

### Existing Tables (✅ Already in Production)

These tables power the current `ClientsManagerPage.tsx` — **DO NOT recreate**, just extend if needed:

```sql
-- CLIENT ROSTER (main client tracking)
-- Table: expert_clients
-- Current columns: id, professional_id, user_id, name, email, phone, notes, status, 
--                  package_name, last_session_date, next_session_date, created_at

-- FOLLOW-UPS (reminder tracking)
-- Table: expert_client_followups
-- Current columns: id, client_id, note, due_date, resolved, created_at

-- LEADS (potential clients)
-- Table: expert_leads
-- Current columns: id, professional_id, name, email, phone, source, interest, 
--                  status, enquiry_date, created_at
```

**Phase 1A Migration**: Add multi-channel tracking columns to `expert_clients`:
```sql
ALTER TABLE expert_clients ADD COLUMN acquisition_source VARCHAR(64);
ALTER TABLE expert_clients ADD COLUMN source_metadata JSONB;
ALTER TABLE expert_clients ADD COLUMN corporate_event_id BIGINT REFERENCES corporate_events(id);
ALTER TABLE expert_clients ADD COLUMN discount_code VARCHAR(64);
ALTER TABLE expert_clients ADD COLUMN is_lead BOOLEAN DEFAULT FALSE;
ALTER TABLE expert_clients ADD COLUMN lead_score INT;
ALTER TABLE expert_clients ADD COLUMN converted_at TIMESTAMPTZ;

CREATE INDEX idx_expert_clients_source ON expert_clients(acquisition_source);
CREATE INDEX idx_expert_clients_is_lead ON expert_clients(is_lead);
```

### New Tables (🆕 Phase 1B — Routine Management)

These tables are **NEW** for the routine management feature:

```sql
-- ROUTINE DEFINITION (the program/plan)
CREATE TABLE routines (
    id BIGSERIAL PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES professionals(user_id) ON DELETE CASCADE,
    client_id BIGINT NOT NULL REFERENCES expert_clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- State machine: draft | under_review | approved | published | archived
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    
    -- Source: manual | ai_generated
    source_type VARCHAR(32) NOT NULL DEFAULT 'manual',
    
    -- JSON metadata: client goals, preferences, AI generation context
    metadata JSONB,
    
    -- AI recommendation snapshot (append-only audit trail)
    ai_recommendation JSONB,
    
    -- Approval gate: NULL until expert approves
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    
    -- Publishing: NULL until published to client
    published_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    INDEX idx_routine_professional (professional_id),
    INDEX idx_routine_client (client_id),
    INDEX idx_routine_status (status)
);

-- ROUTINE ITEMS (exercises, meals, activities within a routine)
CREATE TABLE routine_items (
    id BIGSERIAL PRIMARY KEY,
    routine_id BIGINT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    
    -- Type: exercise | meal | meditation | checkpoint | note
    item_type VARCHAR(32) NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INT NOT NULL DEFAULT 1,
    
    -- JSON: sets, reps, duration, ingredients, instructions, etc.
    parameters JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    INDEX idx_routine_item_routine (routine_id)
);

-- PERFORMANCE TRACKING (client check-ins)
CREATE TABLE routine_check_ins (
    id BIGSERIAL PRIMARY KEY,
    routine_id BIGINT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    client_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status: completed | partial | skipped
    completion_status VARCHAR(32) NOT NULL,
    
    notes TEXT,
    
    -- JSON: metrics logged by client (weight, reps, time, mood)
    metrics JSONB,
    
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    INDEX idx_checkin_routine (routine_id),
    INDEX idx_checkin_client (client_user_id),
    INDEX idx_checkin_date (checked_in_at)
);

-- EXPERT FEEDBACK (expert reviews client progress)
CREATE TABLE routine_expert_feedback (
    id BIGSERIAL PRIMARY KEY,
    routine_id BIGINT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES professionals(user_id) ON DELETE CASCADE,
    
    feedback TEXT NOT NULL,
    
    -- Type: adjustment | encouragement | concern
    feedback_type VARCHAR(32) NOT NULL DEFAULT 'adjustment',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    INDEX idx_feedback_routine (routine_id),
    INDEX idx_feedback_professional (professional_id)
);
```

**Schema Rationale**:
- **Status workflow**: Explicit state machine prevents AI content from bypassing approval
- **`ai_recommendation` JSONB**: Immutable snapshot for audit trail, quality analysis, and expert override tracking
- **`approved_by` + timestamps**: Liability protection, shows expert human-in-the-loop
- **Separate `routine_items` table**: Flexible composition, easy reordering, per-item tracking
- **Check-ins as append-only ledger**: Like coin transactions, never mutate — always append new records

---

## AI Integration (Phase 2)

### Architecture: Async Job Queue (Non-Blocking UX)

```
1. Expert clicks "Generate AI Routine" 
   → POST /api/v1/partners/me/routines/generate
   → Backend enqueues job, returns job_id immediately

2. Background worker picks up job (Arq/Celery)
   → Calls LLM API (10-30s latency)
   → Parses structured JSON response
   → Creates routine with status="under_review"
   → Stores AI output in ai_recommendation JSONB

3. Expert receives notification: "AI routine ready for review"
   → Opens side-by-side review UI
   → Edits AI draft inline
   → Clicks "Approve & Publish" → status="approved" → published to client
```

**Why async vs sync?**
- ❌ **Sync API call**: 10-30s request timeout, poor UX, no retry on failure
- ✅ **Async job queue**: Non-blocking, retry-able, observable, scales independently

### LLM Provider Considerations

| Provider | Structured Output | Latency | Cost/Routine | Recommendation |
|----------|------------------|---------|-------------|----------------|
| **OpenAI GPT-4** | ✅ Function calling | ~8-15s | $0.15-0.30 | ✅ Start here (best structured output) |
| **Anthropic Claude** | ⚠️ Prompt engineering | ~6-12s | $0.10-0.25 | Alternative if prompt quality matches |
| **Open-source (Llama 3)** | ❌ Requires fine-tuning | ~5-10s | Self-hosted costs | Phase 3 cost optimization |

**Phase 2 Recommendation**: OpenAI GPT-4 with function calling for structured `routine_items` JSON output.

### Prompt Engineering Guidelines

```python
# backend/app/services/routines/ai_generator.py

ROUTINE_GENERATION_PROMPT = """
You are a {specialty} expert creating a personalized routine for a client.

CLIENT PROFILE:
- Goals: {goals}
- Experience Level: {experience_level}
- Available Equipment: {equipment}
- Time Availability: {time_per_session} minutes/session, {sessions_per_week} sessions/week
- Preferences: {preferences}
- Restrictions: {restrictions}

Generate a {duration}-week routine with the following structure:
1. Weekly schedule (which days, what focus)
2. Per-session exercises/activities with:
   - Exercise name
   - Sets, reps, duration (as applicable)
   - Intensity level (beginner/intermediate/advanced)
   - Form cues or safety notes
3. Progression guidelines (how to advance each week)
4. Rest day recommendations

Output JSON format:
{{
  "title": "4-Week Lower Back Recovery Program",
  "description": "Progressive rehabilitation routine...",
  "routine_items": [
    {{
      "item_type": "exercise",
      "title": "Cat-Cow Stretch",
      "description": "Mobilize spine, warm up core",
      "display_order": 1,
      "parameters": {{
        "sets": 2,
        "reps": 10,
        "duration_seconds": 60,
        "intensity": "beginner",
        "form_cues": ["Keep movements slow", "Breathe deeply"]
      }}
    }},
    ...
  ]
}}

CRITICAL: Recommend only evidence-based, safe exercises appropriate for the experience level.
"""
```

**Quality Gates**:
- Expert approval rate target: >70% (with edits allowed)
- Zero safety incidents from AI recommendations (continuous monitoring)
- Expert editing time: <8min (if higher, manual creation is faster)

---

## Security & Access Control

### Authorization Matrix

| Resource | Read Access | Write Access | Enforcement |
|----------|-------------|--------------|-------------|
| **Routine (draft)** | Professional only | Professional only | `routine.professional_id == current_user.id` |
| **Routine (published)** | Professional + assigned client | Professional only | Backend validates ownership + client assignment |
| **Routine items** | Inherits from parent routine | Professional only | Cascade from routine access check |
| **Check-ins** | Professional + assigned client | Assigned client only | `checkin.client_user_id == current_user.id` |
| **Expert feedback** | Professional + assigned client | Professional only | `feedback.professional_id == current_user.id` |

### Critical Security Rules

1. **No AI bypass**: Backend enforces `approved_by IS NOT NULL` before allowing `status='published'`
2. **Client data isolation**: Clients can ONLY access routines where `routine.client_id` links to their `expert_clients` relationship
3. **Rate limiting**: AI generation endpoint enforces per-tier quotas:
   - Pro: 20 generations/month
   - Elite: Unlimited (but still rate-limited to prevent abuse)
4. **Audit trail**: All status transitions logged with `updated_by`, `updated_at` for compliance

---

## API Contracts (Backend Routes)

### Phase 1 — Manual Routine Management

```python
# backend/app/api/v1/partners.py

@router.get("/me/clients/{client_id}/routines")
async def list_client_routines(client_id: int, current_user: User):
    """List all routines for a specific client (expert view)."""
    # Returns: [{ id, title, status, created_at, published_at }]

@router.post("/me/clients/{client_id}/routines")
async def create_routine(client_id: int, payload: CreateRoutineRequest, current_user: User):
    """Create a new routine (manual, status=draft)."""
    # Returns: { id, title, status, routine_items: [] }

@router.put("/me/routines/{routine_id}")
async def update_routine(routine_id: int, payload: UpdateRoutineRequest, current_user: User):
    """Update routine metadata or items (expert only, pre-publish)."""

@router.post("/me/routines/{routine_id}/publish")
async def publish_routine(routine_id: int, current_user: User):
    """Approve and publish routine to client (changes status to 'published')."""
    # Validation: status must be 'approved', items must be non-empty
    # Side effects: Triggers notification to client, coins event (if applicable)

@router.delete("/me/routines/{routine_id}")
async def archive_routine(routine_id: int, current_user: User):
    """Archive routine (soft delete, status='archived')."""
```

### Phase 2 — AI-Assisted Generation

```python
@router.post("/me/clients/{client_id}/routines/generate")
async def generate_ai_routine(client_id: int, payload: AIRoutineGenerationRequest, current_user: User):
    """
    Enqueue AI routine generation job.
    
    Request:
    {
      "goals": ["weight loss", "improve flexibility"],
      "duration_weeks": 4,
      "sessions_per_week": 3,
      "time_per_session_minutes": 45,
      "experience_level": "beginner",
      "equipment_available": ["mat", "resistance bands"]
    }
    
    Response:
    {
      "job_id": "uuid-v4",
      "status": "queued",
      "estimated_completion_seconds": 30
    }
    """
    # Validation: Check tier quota (Pro: 20/month, Elite: unlimited)
    # Enqueue job → return job_id immediately

@router.get("/me/jobs/{job_id}")
async def get_job_status(job_id: str, current_user: User):
    """
    Poll AI generation job status.
    
    Response (in-progress):
    { "status": "processing", "progress_percent": 40 }
    
    Response (completed):
    { "status": "completed", "routine_id": 12345 }
    
    Response (failed):
    { "status": "failed", "error": "LLM API timeout" }
    """

@router.post("/me/routines/{routine_id}/approve")
async def approve_ai_routine(routine_id: int, payload: ApproveRoutineRequest, current_user: User):
    """
    Expert approves AI-generated routine (with optional edits).
    Sets approved_by, approved_at, changes status to 'approved'.
    Must be followed by /publish to make visible to client.
    """
```

---

## Frontend Implementation Guidance

### V2 Dashboard Integration

**Base Component**: `frontend/components/dashboard/elite/ClientsManagerPage.tsx` (✅ EXISTING)  
**Current Tabs**: Clients | Follow-ups | Leads  
**New Tab**: Routines (Phase 1B)  
**Navigation**: Accessed via "Clients" in `EliteSideNav` within `EliteBodyExpertShell`  

**Entry Points**:
1. **ClientsManagerPage** → Client detail sheet → NEW "Routines" tab → "Create Routine" button
2. **Dashboard sidebar** → "Clients" → Select client → Routines section
3. **Post-booking prompt** (Phase 2) → "Add [Client Name] to your roster and create their first routine"

**Enhanced Components Structure**:
```
frontend/components/dashboard/elite/
├── ClientsManagerPage.tsx       # ✅ EXISTING — Add Routines tab to client detail
├── clientsApi.ts                # ✅ EXISTING — Extend with routine API calls
└── routines/                    # 🆕 NEW — Routine-specific components
    ├── RoutineList.tsx          # List all routines for a client
    ├── RoutineEditor.tsx        # Create/edit routine (manual mode, Phase 1B)
    ├── AIRoutineGenerator.tsx   # Phase 2: AI generation form
    ├── AIReviewModal.tsx        # Phase 2: Side-by-side AI review
    ├── RoutineItemCard.tsx      # Single exercise/meal card
    ├── PublishConfirmation.tsx  # Final approval modal
    └── PerformanceOverview.tsx  # Phase 2/3: Client progress charts

frontend/types/
└── routines.ts                  # TypeScript types for Routine, RoutineItem, CheckIn
```

**Integration Pattern**:
```typescript
// Extend ClientsManagerPage.tsx with Routines tab in client detail sheet

export function ClientsManagerPage() {
  const [activeTab, setActiveTab] = useState<"clients" | "followups" | "leads" | "routines">("clients");
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  
  // When client detail sheet opens, fetch routines for that client
  const [clientRoutines, setClientRoutines] = useState<Routine[]>([]);
  
  // Add "Routines" tab to client detail sheet
  // Display RoutineList component showing all routines for selectedClient
}
```

**State Management** (Keep it Simple — React useState initially):
```typescript
// No global store needed for Phase 1 — component-level state is sufficient
// Phase 2/3 may introduce Zustand store if complexity grows

interface RoutineState {
  routines: Routine[];
  selectedRoutine: Routine | null;
  aiGenerationJob: { jobId: string; status: string } | null; // Phase 2
  isLoading: boolean;
  error: string | null;
}
```

**Phase 2: AI Review UX Pattern**:
```
┌─────────────────────────────────────────────┐
│  AI Suggestion (Read-Only)  │  Your Edits  │
├─────────────────────────────┼──────────────┤
│  Exercise: Cat-Cow Stretch  │  [Edit] [✓]  │
│  Sets: 2, Reps: 10          │              │
│  Form Cue: "Keep slow"      │  [Add note]  │
├─────────────────────────────┼──────────────┤
│  Exercise: Bird Dog          │  [Edit] [✓]  │
│  Sets: 3, Reps: 8/side      │              │
└─────────────────────────────┴──────────────┘

[Reject & Regenerate]  [Approve & Publish →]
```

### Client Dashboard — Routine View

**Location**: `frontend/app/(dashboard)/client/routines/[id]/page.tsx`

**Features**:
- Display routine title, description, expert name/avatar
- Expandable exercise/meal cards with instructions
- "Mark as Complete" button per item (logs check-in)
- Progress tracker: "Week 1 of 4, Session 3 of 12 completed"
- Expert feedback section (read-only for client)

---

## Testing Strategy

### Unit Tests (Backend)

```python
# backend/tests/test_routines_service.py

def test_create_routine_manual():
    """Expert creates manual routine, status is 'draft'."""

def test_publish_routine_without_approval_fails():
    """Cannot publish routine if approved_by is NULL."""

def test_client_cannot_access_other_experts_routines():
    """Authorization boundary check."""

def test_ai_generation_respects_tier_quota():
    """Pro tier blocked at 21st generation in a month."""
```

### Integration Tests

```python
# backend/tests/test_routines_integration.py

def test_end_to_end_manual_routine_flow():
    """Expert creates → adds items → publishes → client views."""

def test_ai_generation_flow():
    """Expert requests AI → job completes → expert reviews → approves → client receives."""
```

### Frontend Tests

```typescript
// frontend/components/dashboard/routines/RoutineEditor.test.tsx

it('prevents publishing without approval', () => {
  // Attempt to click publish on draft routine
  // Expect: button disabled or error modal
});

it('shows AI suggestion side-by-side in Phase 2', () => {
  // Render AIReviewModal with mock AI recommendation
  // Expect: left pane = AI, right pane = editable
});
```

---

## Success Metrics & Monitoring

### Phase 1 KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Feature adoption** | 50+ Pro trainers | Count of trainers who created ≥1 routine |
| **Routine publishing rate** | 5+ routines/trainer/month | Avg routines published per active trainer |
| **Time-to-create (manual)** | Establish baseline | Median time from "Create" → "Publish" |

### Phase 2 KPIs (AI Layer)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **AI acceptance rate** | >70% | % of AI routines approved (with or without edits) |
| **Time-to-publish (AI-assisted)** | <7min | Median time from "Generate" → "Publish" |
| **Expert editing rate** | 40-60% | % of AI routines edited before approval (too low = AI not useful, too high = AI quality poor) |
| **Client satisfaction** | ≥4.5/5 | Survey: "How satisfied are you with your routine?" |
| **Safety incidents** | 0 | Reports of injury from AI-recommended exercises |

### Guardrail Metrics

| Metric | Threshold | Action if Breached |
|--------|-----------|-------------------|
| **Expert approval time** | >8min | AI quality review — prompts may be generating overly complex routines |
| **AI rejection rate** | >40% | Pause new generations, audit last 50 rejections for common issues |
| **Client routine completion** | <40% | Review routine difficulty calibration — may be too aggressive |

---

## Implementation Checklist

### Phase 1 — Unified Client Management Dashboard ✓

**Schema & Data Model**:
- [ ] **Client source tracking migration**: Add `acquisition_source`, `source_metadata`, `corporate_event_id`, `discount_code`, `is_lead`, `lead_score`, `converted_at` columns to `expert_clients`
- [ ] **Routine schema migration**: Create `routines`, `routine_items`, `routine_check_ins`, `routine_expert_feedback` tables

**Backend Services**:
- [ ] **Routines service**: `services/routines/service.py` with CRUD + approval workflow
- [ ] **Backend routes**: `/api/v1/partners/me/clients/{id}/routines` (create, list, update, publish, archive)
- [ ] **Authorization middleware**: Validate expert owns client relationship before routine access
- [ ] **Client source tracking**: Update client creation endpoints to accept `acquisition_source` and `source_metadata`

**Frontend — Unified Dashboard**:
- [ ] **Client list view**: Aggregate clients with source indicators (invited, corporate, recommendation, lead)
- [ ] **Client detail dashboard**: Single page showing Profile + Follow-Ups (existing) + Sessions (existing) + Routines (new) + Messages (existing)
- [ ] **Routine editor**: Manual routine builder (create, assign items, publish)
- [ ] **Routine list**: Display all routines for a client with status indicators
- [ ] **Client view**: Read-only routine display in client dashboard
- [ ] **Follow-up integration**: Display existing follow-ups in client detail (no new backend work)
- [ ] **Sessions integration**: Display existing bookings/classes in client detail (no new backend work)

**Testing & Validation**:
- [ ] **Tests**: Unit + integration coverage for routine approval workflow
- [ ] **Tests**: Client source tracking (create client with different sources, verify metadata)
- [ ] **Phase 1 validation**: 10 Pro trainers beta test, measure time-to-create baseline, collect feedback on unified dashboard

### Phase 2 — AI-Assisted Generation (Pending Phase 1 Success)

- [ ] **Infrastructure**: Set up Arq job queue + Redis
- [ ] **AI service**: `services/routines/ai_generator.py` with LLM integration (OpenAI GPT-4)
- [ ] **Prompt engineering**: Tune prompts for 3 disciplines (fitness, nutrition, wellness)
- [ ] **Backend routes**: `/generate`, `/jobs/{job_id}` (async job polling)
- [ ] **Tier quota enforcement**: Middleware to check generation limits
- [ ] **Frontend**: AI generation form + job status polling + side-by-side review UI
- [ ] **Monitoring**: Log AI acceptance rate, expert editing patterns, generation latency
- [ ] **Lead scoring** (optional): Algorithm to score leads, prioritize in dashboard
- [ ] **Phase 2 validation**: 50 trainers, measure time savings vs Phase 1 baseline

---

## Constraints & Non-Negotiables

1. **Expert approval is mandatory**: No AI content reaches clients without expert approval. Backend enforces this at schema level (`approved_by` NOT NULL before publish).
2. **Routines are modular**: Do NOT tightly couple to bookings, messaging, or coins. Use event-driven integrations.
3. **AI audit trail**: Always store `ai_recommendation` JSONB snapshot — never mutate, only append new versions.
4. **Client data isolation**: Strict authorization checks — clients can ONLY see routines assigned to them.
5. **Phase discipline**: Do NOT mix Phase 1 and Phase 2 work. Ship Phase 1 fully, validate adoption, THEN start Phase 2.
6. **No premature optimization**: Phase 1 can use simple SQL queries. Only optimize for scale in Phase 3 if usage justifies it.

---

## Common Patterns to Follow

### Creating a New Routine (Backend)

```python
# backend/app/services/routines/service.py

async def create_routine(
    professional_id: UUID,
    client_id: int,
    title: str,
    description: str,
    source_type: str = "manual",
    metadata: dict = None,
) -> Routine:
    """
    Create a new routine in 'draft' status.
    
    Args:
        professional_id: UUID of the expert creating the routine
        client_id: ID from expert_clients table
        title: Routine name (e.g., "4-Week Core Strength")
        description: Summary of routine goals/approach
        source_type: "manual" or "ai_generated"
        metadata: Optional JSON metadata (client goals, preferences)
    
    Returns:
        Routine: Newly created routine object
    
    Raises:
        NotFoundError: If client_id doesn't belong to professional
        QuotaExceededError: If tier quota exceeded (for AI generation)
    """
    # Validate client ownership
    client = await get_expert_client(professional_id, client_id)
    if not client:
        raise NotFoundError("Client not found or not owned by professional")
    
    # Create routine
    routine = Routine(
        professional_id=professional_id,
        client_id=client_id,
        title=title,
        description=description,
        status="draft",
        source_type=source_type,
        metadata=metadata or {},
    )
    
    db.add(routine)
    await db.commit()
    await db.refresh(routine)
    
    return routine
```

### Publishing a Routine (with Validation)

```python
async def publish_routine(routine_id: int, expert_id: UUID) -> Routine:
    """
    Publish a routine to the assigned client.
    
    Validates:
    - Expert owns the routine
    - Routine has been approved (approved_by is not NULL)
    - Routine has at least one item
    
    Side effects:
    - Sets published_at timestamp
    - Changes status to 'published'
    - Emits 'routine_published' event (for notifications, coins)
    """
    routine = await get_routine(routine_id)
    
    # Authorization
    if routine.professional_id != expert_id:
        raise ForbiddenError("You do not own this routine")
    
    # Validation
    if routine.approved_by is None:
        raise ValidationError("Routine must be approved before publishing")
    
    if len(routine.routine_items) == 0:
        raise ValidationError("Routine must have at least one item")
    
    # Publish
    routine.status = "published"
    routine.published_at = datetime.utcnow()
    
    await db.commit()
    
    # Emit event (decoupled integration)
    await event_bus.emit("routine_published", {
        "routine_id": routine.id,
        "professional_id": routine.professional_id,
        "client_id": routine.client_id,
    })
    
    return routine
```

### AI Generation Job (Phase 2 Pattern)

```python
# backend/app/services/routines/ai_generator.py

async def generate_ai_routine_async(
    routine_id: int,
    professional_id: UUID,
    generation_params: dict,
):
    """
    Background job: Generate AI routine recommendation.
    
    This runs in a worker process (Arq/Celery), not the web handler.
    """
    try:
        # Fetch routine
        routine = await get_routine(routine_id)
        
        # Build prompt context
        prompt = build_routine_prompt(
            specialty=routine.metadata.get("specialty"),
            goals=generation_params.get("goals"),
            duration_weeks=generation_params.get("duration_weeks"),
            ...
        )
        
        # Call LLM API
        response = await openai_client.create_completion(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            functions=[ROUTINE_SCHEMA],  # Structured output
            timeout=30,
        )
        
        # Parse AI response
        ai_recommendation = response.choices[0].message.function_call.arguments
        
        # Store AI recommendation (immutable snapshot)
        routine.ai_recommendation = ai_recommendation
        routine.status = "under_review"
        
        # Create routine items from AI output
        for item_data in ai_recommendation["routine_items"]:
            item = RoutineItem(
                routine_id=routine.id,
                item_type=item_data["item_type"],
                title=item_data["title"],
                description=item_data["description"],
                display_order=item_data["display_order"],
                parameters=item_data["parameters"],
            )
            db.add(item)
        
        await db.commit()
        
        # Emit event: AI generation completed
        await event_bus.emit("ai_routine_generated", {
            "routine_id": routine.id,
            "professional_id": professional_id,
        })
        
    except Exception as e:
        # Log error, mark job as failed
        logger.error(f"AI generation failed for routine {routine_id}: {e}")
        routine.status = "ai_generation_failed"
        routine.metadata["error"] = str(e)
        await db.commit()
        
        raise  # Re-raise for job queue retry logic
```

---

## Related Documentation

- [AI Pricing & Tier Strategy](../docs/AI_DONT_DELETE_HOLISTIC_PLAN.md) — Subscription tiers, feature gating
- [Backend Service Patterns](../backend/README.md) — FastAPI service architecture
- [Partner Dashboard Spec](../docs/high_priority_refactor_todo.md) — Elite dashboard roadmap
- [Coins Economy](./coins-system.instructions.md) — Integration with routine milestones

---

## FAQ

**Q: Why async AI generation instead of sync?**  
A: LLM APIs have 10-30s latency. Sync requests block the web handler, time out, and can't retry on failure. Async job queues provide better UX (instant response) and reliability (automatic retries).

**Q: Why store `ai_recommendation` JSON snapshot?**  
A: Audit trail for quality analysis (which prompts work), expert override tracking (what do experts change), and safety investigations (if a routine causes issues, we need to know what the AI originally recommended).

**Q: Can we skip expert approval for "simple" routines?**  
A: No. This is a non-negotiable safety and liability requirement. Even seemingly simple routines can cause injury if not properly tailored to the client's condition. Expert review is the product differentiator vs generic AI fitness apps.

**Q: Should routines be versioned (edit history)?**  
A: Not in Phase 1. Phase 1 only tracks draft → approved → published. Phase 3 may add versioning if experts request "routine revision history" or "compare to previous version" features. Don't over-engineer prematurely.

**Q: How do we prevent AI cost abuse (spam generation)?**  
A: Tier-based quotas (Pro: 20/month, Elite: unlimited) + rate limiting (max 5 concurrent jobs per expert) + monitoring dashboards. If abuse detected, temporarily suspend generation access for that account.

**Q: What if an expert wants to share a routine template with other experts?**  
A: Phase 2/3 feature: Routine templates library. Experts can mark routines as "template" and optionally share to platform library. Out of scope for Phase 1.

**Q: How do corporate event clients differ from regular clients in the Client Manager?**  
A: Corporate event clients have `corporate_event_id` and `discount_code` fields populated. The Client Manager displays a "Corporate Event" badge and shows event details in the client profile. Pricing discounts are handled by the payment service, not Client Manager — Client Manager only stores the relationship.

**Q: Can a client have multiple acquisition sources (e.g., invited by expert AND from corporate event)?**  
A: No. `acquisition_source` is a single value representing the PRIMARY source. If a client is invited by an expert to a corporate event, use `acquisition_source = 'corporate_event'` and store the expert invite details in `source_metadata.invited_by`. The most specific/valuable attribution wins.

**Q: What's the difference between "Wolistic recommendation" and "organic search"?**  
A: **Wolistic recommendation**: Platform actively matched the client to 3 specific experts based on intake form (curated). **Organic search**: Client browsed/searched and found the expert independently (self-service). Recommendation tracks which experts were shown; organic search tracks search query.

**Q: Do leads show up in the main client list or separately?**  
A: Phase 1: Leads (`is_lead = TRUE`) are filtered separately — experts see "Active Clients" and "Leads" as distinct tabs/sections. Phase 2: Add lead scoring, nurture workflows, and conversion tracking. We don't want leads mixed with active clients because they require different actions (nurture vs. manage).

**Q: How does Client Manager integrate with existing follow-ups and sessions?**  
A: Client Manager is a DASHBOARD that aggregates existing features, not a replacement. Follow-ups use the existing `expert_client_followups` table and API. Sessions use the existing booking system. Routines are the only NEW backend feature. The frontend just displays all of these in one unified client detail view.

**Q: Should we track which of the 3 recommended experts the client chose?**  
A: Yes. Store in `source_metadata.selected_expert` for attribution analytics. This helps measure recommendation algorithm quality: if clients always pick expert #3, the ranking may need tuning. Also tracks whether being recommended (but not selected) still drives future bookings.
