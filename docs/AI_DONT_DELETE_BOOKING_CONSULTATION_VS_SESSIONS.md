# Booking Systems: Consultation vs Sessions

**Status**: Phase 1 Implementation Ready  
**Date**: April 16, 2026  
**Version**: 1.1 (Added Tier-Based Limits & Upsell Strategy)

---

## Table of Contents

1. [Overview](#overview)
2. [System Comparison](#system-comparison)
3. [Data Model](#data-model)
4. [Business Rules](#business-rules)
5. [Refund Logic & Trust Protection](#refund-logic--trust-protection)
6. [Class Template Expiry System](#class-template-expiry-system)
7. [Tier-Based Limits & Upsell Strategy](#tier-based-limits--upsell-strategy)
8. [Implementation Phases](#implementation-phases)
9. [API Specifications](#api-specifications)
10. [UX Flows](#ux-flows)
11. [Edge Cases & Resolutions](#edge-cases--resolutions)
12. [Success Metrics](#success-metrics)
13. [Technical Debt & Future Considerations](#technical-debt--future-considerations)
14. [Glossary](#glossary)

---

## Overview

Wolistic has **two distinct booking systems** serving different use cases:

### 1. Consultation Booking (1:1)
Individual consultations between a client and a professional. Supports intake questions, service selection, and personalized scheduling.

**Current State**: ✅ Fully implemented and public-facing

### 2. Session Booking (1:Many)
Group classes, workshops, and sessions where one professional serves multiple clients simultaneously. Simplified enrollment with capacity management.

**Current State**: ⚠️ Dashboard-only (Elite tier management tool)  
**Phase 1 Goal**: Make public-facing with client enrollment + payment + refund protection

---

## System Comparison

| Feature | Consultation Booking | Session Booking |
|---------|---------------------|-----------------|
| **Participants** | 1:1 (expert + client) | 1:many (expert + multiple clients) |
| **Booking Unit** | Service (from services list) | Session (instance of a class template) |
| **Scheduling** | Single date/time or immediate | Multiple recurring sessions |
| **Capacity** | 1 client | Configurable (default 20) |
| **Location** | Service mode (online/offline/chat/video) | Explicit work locations + online |
| **Payment** | Per booking with promotional offers | Per enrollment with capacity-based pricing |
| **Questions** | Yes - expert-defined intake questions | No - simplified enrollment |
| **Use Cases** | Initial consultations, 1:1 coaching, therapy | Group yoga, fitness classes, workshops, events |
| **Terminology** | "Book Consultation" | "Book Session" / "Book Workshop" / "Book Class" (expert choice) |

---

## Data Model

### Hierarchy

```
Professional
  │
  ├─── ProfessionalService (1:1 Consultations)
  │      └─── Booking
  │             ├─── BookingQuestionResponse
  │             └─── BookingPayment
  │
  └─── GroupClass (Template)
         ├─── title: "Morning Yoga"
         ├─── category: yoga | zumba | pilates | hiit | dance | other
         ├─── status: draft | active | cancelled
         ├─── expires_on: DATE (mandatory expiry)
         ├─── display_term: "session" | "workshop" | "class"
         └─── ClassSession (Specific Occurrences)
                ├─── Session 1: April 21, 2026 @ 6:00 PM
                │      ├─── status: draft | published | cancelled
                │      └─── ClassEnrollment (Client A paid ₹500)
                │             ├─── status: confirmed | attended | no_show_client | cancelled_expert | cancelled_client | refunded
                │             └─── payment details
                └─── Session 2: April 28, 2026 @ 6:00 PM
                       └─── ClassEnrollment (Client B paid ₹500)
```

### Key Tables

#### Consultations
- `bookings` - Main booking record
- `booking_question_templates` - Expert-defined intake questions
- `booking_question_responses` - Client answers
- `booking_payments` - Payment tracking

#### Sessions
- `group_classes` - Class template (recurring pattern)
- `class_sessions` - Specific session instances (individual dates/times)
- `class_enrollments` - Client enrollment records
- `session_interest` - Interest tracking for sold-out sessions
- `work_locations` - Physical/online locations for classes
- `expert_session_reliability` - Expert accountability metrics

---

## Business Rules

### SESSION Operations

| Action | Conditions | Result |
|--------|-----------|--------|
| **Cancel Session** | Session is published + has enrollments | Refund all enrollments for THAT session only |
| **Delete Session** | Session is draft (not published) | Deleted, no impact |
| **Delete Session** | Session is published (no enrollments yet) | Allowed, removes from public view |
| **Delete Session** | Session is published + has enrollments | ❌ **BLOCKED** - must cancel instead (triggers refund) |
| **Publish Session** | Session is draft | Shows warning modal → status='published' → visible to clients |
| **Edit Session** | Session is draft | ✅ All fields editable |
| **Edit Session** | Session is published (no enrollments) | ⚠️ Limited fields only (description, increase capacity) |
| **Edit Session** | Session is published + has enrollments | ❌ **BLOCKED** - date/time/location locked (trust protection) |

### CLASS Template Operations

| Action | Conditions | Result |
|--------|-----------|--------|
| **Delete Class** | No sessions exist | Deleted |
| **Delete Class** | Only draft sessions exist | Deleted (cascade to sessions) |
| **Delete Class** | Has published sessions (no enrollments) | ⚠️ Warning: "X sessions will be unpublished" → confirm → delete |
| **Delete Class** | Has sessions with enrollments | ⚠️ Warning: "Will cancel X sessions and refund Y clients (₹Z total)" → confirm → mass cancel + refund |
| **Deactivate Class** | Any state | Status → 'cancelled', future sessions hidden, existing enrollments honored |
| **Edit Class** | Has published sessions with enrollments | ❌ **BLOCKED** - "Cannot edit - users enrolled based on current details" |
| **Edit Class** | Has only draft sessions OR published sessions without enrollments | ✅ Allowed - changes apply to those sessions |
| **Renew Class** | At/after expiry | Extends `expires_on` → optionally allows edit if no active enrollments |

### Session Immutability Rules

**Once a session is published + has enrollments or interest:**

#### ✅ ALWAYS Editable (Marketing/Clarification)
- Description
- Work location name (if typo fix, not actual location change)

#### ⚠️ CONDITIONALLY Editable (Only if No Enrollments)
- Capacity (can only **INCREASE**, never decrease)
- Price (can only **DECREASE** for promotional discount)

#### ❌ NEVER Editable After Publication
- `session_date` - breaks client's scheduling commitment
- `start_time` - user enrolled based on time preference
- `group_class_id` - changes the entire session type
- `work_location_id` - actual location change (address/venue)

**Rationale**: Trust protection. Client enrolled based on specific date/time/location. Changing these = breach of contract.

---

## Refund Logic & Trust Protection

### Core Principles

1. **Client trust is non-negotiable**: When in doubt, refund.
2. **Expert accountability drives quality**: Track cancellation patterns, flag repeat offenders.
3. **Platform transparency builds credibility**: Clear cancellation policy shown BEFORE payment.

### Enrollment Lifecycle States

```
confirmed       ← Default after payment
   ↓
   ├─→ attended (expert marks post-session) → transaction complete
   ├─→ no_show_client (expert marks) → expert keeps payment, no refund
   ├─→ cancelled_expert (expert cancels session) → 100% auto-refund
   ├─→ cancelled_client (client cancels) → refund per policy (Phase 2)
   ├─→ disputed (client claims didn't happen) → platform review (Phase 2)
   └─→ refunded → money returned to client
```

### Refund Policy Matrix

| Scenario | Refund | Expert Impact | Client Impact |
|----------|--------|---------------|---------------|
| **Expert cancels (>24h before)** | 100% auto-refund | Warning (if >2/month) | Email notification + refund |
| **Expert cancels (<24h before)** | 100% auto-refund + ₹100 credit | Penalty flag; affects tier status if repeated | Email + refund + apology credit |
| **Expert no-show (doesn't mark attendance within 48h)** | 100% auto-refund | Reliability score hit; potential tier downgrade | Auto-refund + platform apology |
| **Expert marks "session cancelled"** | 100% auto-refund | Reliability tracking | Email + refund |
| **Expert marks "attended"** | No refund | Transaction complete | Session honored |
| **Expert marks "client no-show"** | No refund | Expert compensated for reserved spot | No refund (client's responsibility) |
| **Client cancels (>24h before)** | 100% refund *(Phase 2)* | No impact | Instant refund |
| **Client cancels (<24h before)** | 50% refund or no refund *(Phase 2)* | Expert compensated for lost booking window | Partial refund only |
| **Client disputes "didn't happen"** | Held pending expert response *(Phase 2)* | Expert has 24h to respond | Platform review required |

### Auto-Refund Triggers

1. **Expert-initiated cancellation**: Immediate refund to all enrolled clients
2. **48-hour grace period expired**: If expert doesn't mark attendance within 48h of session time → auto-refund
3. **Class deletion with enrollments**: Mass cancellation + bulk refunds

### Expert Reliability Tracking

```sql
expert_session_reliability:
  - total_sessions: Total sessions conducted
  - cancelled_sessions: Expert-initiated cancellations
  - late_cancellations: Cancellations <24h before session (<24h)
  - no_show_sessions: Sessions where attendance wasn't marked
  - reliability_score: Calculated metric (e.g., 0.95 = 95% reliable)
```

**Tier Impact**:
- Reliability score < 0.85 → Warning email
- Reliability score < 0.75 → Elite tier downgrade consideration
- 3+ late cancellations in 30 days → Platform review

### Payment Integration

**Razorpay Integration** (assumed provider):
- Refunds processed via Razorpay API
- Partial refunds supported
- Refund to original payment method
- Processing time: 5-7 business days

**Tracking**:
```sql
class_enrollments:
  - refund_amount: NUMERIC(10,2)
  - refund_processed_at: TIMESTAMPTZ
  - refund_provider_id: VARCHAR(128) -- Razorpay refund ID
```

---

## Class Template Expiry System

### Purpose

**Problem**: Stale class templates with outdated pricing, times, or capacity can erode trust.

**Solution**: Mandatory expiry date on every class template forces periodic review.

### Schema

```sql
group_classes:
  - expires_on: DATE (default: creation_date + 3 months)
  - expired_action_taken: VARCHAR(16) -- 'renewed' | 'cancelled' | 'archived'
```

### Business Rules

| State | Behavior |
|-------|----------|
| **Before expiry** | Sessions can be created normally (up to `expires_on`) |
| **At/after expiry** | ❌ Cannot create new sessions beyond `expires_on` |
| **Expiry reached** | Template appears in "Needs Review" section of dashboard |
| **Expert action required** | Renew (extend + optional edit) \| Cancel (with refunds) \| Archive (keep existing sessions only) |

### Validation

```python
# Session creation validation
if session_date > group_class.expires_on:
    raise HTTPException(400, detail="Cannot create session beyond class expiry date. Renew class first.")
```

### Renewal Options

**When renewing an expired class**:

1. **Renew as-is** (no changes):
   - Extends `expires_on` by default period (e.g., +3 months)
   - All existing details remain unchanged
   - New sessions use current template

2. **Renew + update** (conditionally):
   - Only allowed if **no active enrollments** exist
   - Can update price, time, capacity, description
   - Prevents trust erosion (enrolled users expect original details)

3. **Cancel**:
   - Cancels all future sessions with enrollments → triggers refunds
   - Marks class template as cancelled

4. **Archive**:
   - Keeps existing sessions active
   - Prevents new session creation
   - Template read-only

### Default Expiry Periods

| Class Type | Suggested Expiry | Rationale |
|------------|------------------|-----------|
| Seasonal (e.g., "Summer Bootcamp") | 3 months | Aligns with season change |
| Recurring regular classes | 6 months | Semi-annual review |
| Workshop/Event | 1 month | Short-lived, specific topic |
| Default (if not specified) | 3 months | Forces quarterly review |

### Benefits

| Problem Solved | How |
|----------------|-----|
| **Stale pricing** | Expert forced to review prices every 3-6 months |
| **Time preference drift** | Expert can update time slots seasonally without breaking existing enrollments |
| **Seasonal classes** | "Summer Bootcamp" naturally expires, expert creates "Fall Bootcamp" |
| **Accidental sessions** | Can't accidentally create sessions 1 year in future with outdated info |
| **Template cleanup** | Expired classes surface for review, preventing DB clutter |

---

## Tier-Based Limits & Upsell Strategy

### Business Model: Session Creation as Premium Value Driver

**Core Principle**: Tier-gate session/class creation capacity to drive upgrades while maintaining accessibility.

**Competitive Benchmark**: Calendly gates "event types" on Free tier (1 event type) and achieves 15-20% upgrade conversion from users who hit limits. Wolistic applies similar psychology to class/session creation.

### Tier Limit Matrix

| Tier | Active Classes | Sessions/Month | Monthly Price | Target User |
|------|----------------|----------------|---------------|-------------|
| **Free** | 2 | 8 | ₹0 | Casual instructors testing group sessions |
| **Pro** | 5 | 20 | ₹X | Committed professionals (multiple class types) |
| **Elite** | 15 | 60 | ₹Y | High-volume instructors (studios, multi-location) |
| **Celeb** | Unlimited | Unlimited | ₹Z (invite-only) | Influencer wellness leaders |

### Limit Definitions

**"Active Classes"**:
- Class template with `status = 'active'` AND `expires_on > today`
- Archived/cancelled classes don't count against limit
- Expired classes don't count (forces periodic cleanup)

**"Sessions/Month"**:
- Count of sessions where `session_date` falls within current calendar month
- Only counts published sessions (drafts don't count against limit)
- Resets monthly (e.g., May 1 → user starts at 0/20 for Pro tier)

### Value Proposition Per Tier

#### Free Tier — "Test Without Commitment"
**Limits**: 2 active classes, 8 sessions/month

**Use Case**: Yoga instructor wants to test "Monday Morning Flow" + "Friday Evening Restore" (2 classes × 4 weeks = 8 sessions)

**Upgrade Trigger**: User tries to create 3rd class → "Upgrade to Pro for 5 active classes + priority search ranking"

#### Pro Tier — "Serious Professional"
**Limits**: 5 active classes, 20 sessions/month

**Use Case**: Fitness trainer runs Beginner HIIT, Advanced HIIT, Yoga, Pilates, Meditation (5 classes) with mix of weekly/bi-weekly sessions

**Upgrade Trigger**: User tries to create 21st session in April → "Upgrade to Elite for 60 sessions/month + featured placement"

#### Elite Tier — "Studio/Gym Scale"
**Limits**: 15 active classes, 60 sessions/month

**Use Case**: Studio owner manages multiple class types, times, instructors, locations (morning/evening slots, beginner/advanced levels)

**Upgrade Trigger**: "You're at Elite. Celeb tier coming soon with unlimited capacity."

#### Celeb Tier — "Unrestricted Brand"
**Limits**: Unlimited

**Use Case**: Celebrity wellness influencer running multiple programs, workshops, retreats without capacity concerns

### Enforcement Strategy

#### Hard Limits (Cannot Bypass)
```python
# Class creation validation
if active_class_count >= tier_limit:
    raise HTTPException(403, detail={
        "error": "tier_limit_reached",
        "tier": "free",
        "limit": 2,
        "current_usage": 2,
        "upgrade_required": True
    })

# Session creation validation
if sessions_this_month >= tier_limit:
    raise HTTPException(403, detail={
        "error": "monthly_session_limit_reached",
        "tier": "pro",
        "limit": 20,
        "current_usage": 20,
        "month": "April 2026",
        "upgrade_required": True
    })
```

#### Soft Limits (Graceful Handling)
- **Downgrade mid-month**: Existing classes stay active until expiry, new creations blocked
- **Upgrade mid-month**: Immediately unlocks higher limits, no retroactive restrictions
- **Session crosses month boundary**: Count based on `session_date` only (start date)

### Upgrade Flow UX

#### Modal: Class Limit Reached (Free User)
```
┌─────────────────────────────────────────────┐
│  ⚠️  Upgrade to Create More Classes         │
├─────────────────────────────────────────────┤
│  You've reached the Free tier limit of      │
│  2 active classes.                          │
│                                             │
│  Upgrade to Pro to unlock:                  │
│  ✅ 5 active classes                        │
│  ✅ 20 sessions per month                   │
│  ✅ Priority search ranking                 │
│  ✅ Analytics dashboard                     │
│                                             │
│  [ Stay on Free ]  [ Upgrade to Pro - ₹X ] │
└─────────────────────────────────────────────┘
```

#### Modal: Session Limit Reached (Pro User)
```
┌─────────────────────────────────────────────┐
│  ⚠️  Session Limit Reached for April        │
├─────────────────────────────────────────────┤
│  You've scheduled 20 sessions this month    │
│  (Pro tier limit).                          │
│                                             │
│  Options:                                   │
│  1. Wait until May 1 (5 days)               │
│  2. Upgrade to Elite (60 sessions/month)    │
│                                             │
│  Elite also includes:                       │
│  ✅ 15 active classes                       │
│  ✅ Elite badge (trust signal)              │
│  ✅ Featured placement                      │
│                                             │
│  [ Wait ]  [ Upgrade to Elite - ₹Y ]        │
└─────────────────────────────────────────────┘
```

#### Proactive Prompts (80% of Limit)
```
Dashboard Banner (user at 4/5 active classes, Pro tier):

┌────────────────────────────────────────────────┐
│  💡 You're using 4 of 5 active classes        │
│  Upgrade to Elite for 15 active classes       │
│  [ Upgrade ] [ Dismiss ]                       │
└────────────────────────────────────────────────┘
```

### Technical Implementation

#### Schema: Tier Limits Configuration

```sql
-- Static config (or backend constant)
CREATE TABLE tier_limits (
  tier_name VARCHAR(16) PRIMARY KEY,
  max_active_classes INT NOT NULL,
  max_sessions_per_month INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO tier_limits VALUES
  ('free', 2, 8),
  ('pro', 5, 20),
  ('elite', 15, 60),
  ('celeb', 999999, 999999);  -- "Unlimited"
```

#### API: Usage Endpoint

```http
GET /partners/me/tier-limits
Authorization: Bearer {token}
```

**Response**:
```json
{
  "tier": "pro",
  "limits": {
    "max_active_classes": 5,
    "max_sessions_per_month": 20
  },
  "usage": {
    "active_classes": 4,
    "sessions_this_month": 15,
    "current_month": "April 2026"
  },
  "upgrade_available": true,
  "next_tier": "elite"
}
```

#### Validation Logic

**Class Creation Validation**:
```python
# Count active classes (status='active' AND expires_on > today)
active_count = await db.scalar(
    select(func.count(GroupClass.id))
    .where(GroupClass.professional_id == professional.user_id)
    .where(GroupClass.status == 'active')
    .where(GroupClass.expires_on > date.today())
)

tier_limit = TIER_LIMITS[tier]['max_active_classes']
if active_count >= tier_limit:
    raise HTTPException(403, detail={"error": "tier_limit_reached", ...})
```

**Session Creation Validation**:
```python
# Count sessions in the same month as the new session
session_month = payload.session_date.replace(day=1)

sessions_this_month = await db.scalar(
    select(func.count(ClassSession.id))
    .join(GroupClass, ClassSession.group_class_id == GroupClass.id)
    .where(GroupClass.professional_id == professional.user_id)
    .where(ClassSession.status == 'published')  # Only published sessions count
    .where(func.date_trunc('month', ClassSession.session_date) == session_month)
)

tier_limit = TIER_LIMITS[tier]['max_sessions_per_month']
if sessions_this_month >= tier_limit:
    raise HTTPException(403, detail={"error": "monthly_session_limit_reached", ...})
```

### Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Upgrade conversion (Free → Pro)** | 15-20% of users who hit limit within 7 days | Benchmarked against Calendly |
| **Upgrade conversion (Pro → Elite)** | 10-15% of users who hit limit within 14 days | Smaller pool, higher commitment |
| **Time to limit (Free)** | 30 days median | Validates limit is tight enough to drive upgrades |
| **Time to limit (Pro)** | 90 days median | Serious users, longer runway before hitting ceiling |
| **Downgrade rate after hitting limit** | <5% | Users find value, don't churn in frustration |
| **Sessions created per tier** | Free: 6-8/mo, Pro: 15-18/mo, Elite: 40-50/mo | Validates usage patterns match limits |

**Guardrail Metrics**:
- Free tier signup rate must not drop >10% (limits aren't scaring users away)
- Pro tier satisfaction must stay >4.2/5 (limits aren't frustrating)
- <3% "unfair limits" support tickets (pricing perceived as fair)

### Edge Cases & Resolutions

| Edge Case | Resolution |
|-----------|------------|
| **User downgrades from Pro to Free mid-month** | Existing 5 classes stay active until expiry. User cannot create new classes until count drops below 2. No forced deletion. |
| **User upgrades from Free to Pro mid-month** | Limits immediately increase. Can create 3rd, 4th, 5th class instantly. Sessions remaining this month: 12 more (20 - 8 already created). |
| **Session spans midnight (e.g., 11 PM - 1 AM)** | Count based on `session_date` only (start date). Session on April 30 @ 11 PM counts toward April, even if it ends May 1. |
| **User deletes class, then recreates** | Deletion frees up slot immediately. No "monthly creation quota" — only active count matters. |
| **Bulk session creation (create 10 sessions at once)** | Validate BEFORE creating any. If user has 15/20 sessions and tries to create 10 more → reject all (would exceed 20). Atomic operation. |
| **User creates draft sessions (unpublished)** | Drafts don't count toward monthly limit (only published sessions count). User can create unlimited drafts. |
| **Next month resets session count** | May 1 → session count resets to 0. User can create full monthly allowance again (Pro: 0/20). |

### Competitive Benchmarking

| Platform | Gating Strategy | Insight for Wolistic |
|----------|-----------------|---------------------|
| **Calendly** | Free: 1 event type, Pro: Unlimited | Proven 15-20% conversion driver. Wolistic's 2 classes is more generous (acquisition-friendly). |
| **Mindbody** | $129/mo base (unlimited), per-booking fees | Wolistic's tier model = predictable revenue without per-transaction friction. |
| **ClassPass (instructor)** | Unlimited classes, commission-based | Wolistic's upfront tier pricing = better for high-volume instructors. |
| **Urban Company (Pro partners)** | Unlimited services, but discovery is paid | Wolistic gates both creation AND discovery → stronger upgrade incentive. |

**Key Insight**: Calendly's success with event-type gating proves users accept creation limits as fair premium differentiator. Wolistic's limits are slightly more generous (2 vs 1 for Free tier), reducing friction while maintaining upgrade pressure.

### A/B Test Roadmap (Phase 2)

**Test 1: Free Tier Limit Variation**
- **Hypothesis**: Reducing Free tier from 2 to 1 active class will increase Free → Pro upgrades by 25%
- **Variants**: Control (2 classes) vs Treatment (1 class)
- **Primary Metric**: Upgrade conversion rate
- **Guardrail**: Free tier signup rate must not drop >10%
- **Duration**: 30 days, 500 users per variant

**Test 2: Proactive vs Reactive Prompts**
- **Hypothesis**: Showing upgrade prompt at 80% of limit (proactive) increases conversion by 15% vs showing only when limit hit (reactive)
- **Variants**: Control (reactive only) vs Treatment (proactive + reactive)
- **Primary Metric**: Upgrade conversion rate
- **Duration**: 30 days

---

## Implementation Phases

### Phase 1 — Public Session Discovery + Refund Protection + Tier Enforcement
**Goal**: Make sessions visible to clients with full trust protection + tier-based upsell mechanics

**Scope**:
- ✅ Public API for session discovery
- ✅ Simplified enrollment flow (auth → payment → confirm, no questions)
- ✅ Session publication state (draft → published)
- ✅ Immutability enforcement (published sessions locked)
- ✅ Expert cancellation with auto-refund
- ✅ Attendance marking (attended / no-show / cancelled)
- ✅ Auto-refund for unmarked sessions (48h grace)
- ✅ Class template expiry system
- ✅ Sold-out interest tracking
- ✅ Razorpay refund integration
- ✅ Expert reliability tracking
- ✅ Terminology updates (Service → Consultation, Classes → Sessions)
- ✅ **Tier-based limits enforcement** (active classes + sessions/month)
- ✅ **Upgrade modal flows** (tier limit reached → upgrade prompts)
- ✅ **Usage tracking API** (current usage vs tier limits)
- ✅ **Proactive upgrade prompts** (80% of limit warnings)

**Estimate**: 35-42 days (increased from 29-35 due to tier enforcement scope)

### Phase 2 — Advanced Enrollment & Dispute Resolution & Tier Optimization
**Goal**: Client-initiated cancellations, dispute handling, and tier limit optimization

**Scope**:
- Client-initiated cancellation with refund policy
- Partial refunds based on timing
- Dispute resolution workflow (client claims "didn't happen", expert denies)
- Auto-notification for sold-out → available transitions
- WhatsApp/SMS reminders for manually-enrolled clients
- Multi-session packages (buy 10 sessions, get discount)
- Tier penalties for unreliable experts
- **Tier limit A/B testing** (Free: 1 vs 2 active classes)
- **Upgrade conversion analytics dashboard**
- **Proactive vs reactive upgrade prompt testing**
- **Usage-based email notifications** (approaching limit alerts)

**Estimate**: TBD (after Phase 1 validation)

### Phase 3 — Unified Activity & Analytics
**Goal**: Merge consultation + session analytics

**Scope**:
- Unified "Activity Board" (consultations + sessions)
- Revenue analytics (consultation revenue vs session revenue)
- Client engagement metrics (1:1 vs group preference)
- Waitlist with auto-enrollment (when spots open)
- Gift sessions / referral credits

**Estimate**: TBD (deferred until Phase 2 validates demand)

---

## API Specifications

### Public Endpoints (Client-Facing)

#### List Sessions for a Professional
```http
GET /professionals/{username}/sessions
```

**Response**:
```json
{
  "sessions": [
    {
      "id": 123,
      "class_id": 45,
      "title": "Morning Vinyasa Flow",
      "category": "yoga",
      "display_term": "session",
      "session_date": "2026-04-21",
      "start_time": "06:00:00",
      "duration_minutes": 60,
      "capacity": 20,
      "enrolled_count": 12,
      "is_sold_out": false,
      "price": 500.00,
      "description": "...",
      "work_location": {
        "name": "Elite Fitness Studio",
        "address": "123 Koramangala, Bangalore",
        "location_type": "gym"
      }
    }
  ]
}
```

#### Enroll in a Session
```http
POST /sessions/{session_id}/enroll
Authorization: Bearer {token}
```

**Request**:
```json
{
  "payment_provider": "razorpay",
  "payment_order_id": "order_xyz123"
}
```

**Response**:
```json
{
  "enrollment_id": 789,
  "status": "confirmed",
  "session_details": { ... },
  "payment_confirmation": { ... }
}
```

**Validations**:
- ✅ User authenticated
- ✅ Session is published
- ✅ Capacity not exceeded
- ✅ Payment successful
- ❌ 400 if sold out
- ❌ 409 if already enrolled

#### Register Interest (Sold-Out Sessions)
```http
POST /sessions/{session_id}/interest
Authorization: Bearer {token}
```

**Response**:
```json
{
  "interested": true,
  "message": "We'll notify you if spots open up"
}
```

**Validations**:
- ✅ User authenticated
- ✅ Session is sold out
- ❌ 400 if session still has capacity (should enroll instead)
- ❌ 409 if user already registered interest

---

### Partner Endpoints (Expert-Facing)

#### Publish Session
```http
POST /partners/me/sessions/{session_id}/publish
Authorization: Bearer {token}
```

**Response**:
```json
{
  "id": 123,
  "status": "published",
  "published_at": "2026-04-16T10:30:00Z",
  "is_locked": true
}
```

#### Cancel Session
```http
POST /partners/me/sessions/{session_id}/cancel
Authorization: Bearer {token}
```

**Request**:
```json
{
  "cancellation_reason": "Personal emergency"
}
```

**Response**:
```json
{
  "session_id": 123,
  "status": "cancelled",
  "enrollments_cancelled": 12,
  "total_refunded": 6000.00,
  "refund_status": "processing"
}
```

**Side Effects**:
- All enrollments → status='cancelled_expert'
- Auto-refund initiated for all enrolled clients
- Email notifications sent to clients
- Expert reliability score updated

#### Mark Attendance
```http
POST /partners/me/enrollments/{enrollment_id}/mark-attendance
Authorization: Bearer {token}
```

**Request**:
```json
{
  "attendance_status": "attended" | "no_show_client" | "session_cancelled"
}
```

**Response**:
```json
{
  "enrollment_id": 789,
  "status": "attended",
  "attendance_marked_at": "2026-04-21T19:05:00Z"
}
```

**Validations**:
- ✅ Session date has passed
- ✅ Expert owns the session
- ❌ 400 if attendance already marked

#### Renew Class Template
```http
POST /partners/me/classes/{class_id}/renew
Authorization: Bearer {token}
```

**Request**:
```json
{
  "new_expiry_date": "2026-07-31",
  "update_details": false  // true only if no active enrollments
}
```

**Response**:
```json
{
  "class_id": 45,
  "expires_on": "2026-07-31",
  "expired_action_taken": "renewed",
  "can_edit_details": false
}
```

**Validations**:
- ✅ Expert owns the class
- ❌ 400 if `update_details=true` but active enrollments exist

#### List Expiring Classes
```http
GET /partners/me/classes/expiring-soon
Authorization: Bearer {token}
```

**Response**:
```json
{
  "expiring_soon": [
    {
      "class_id": 45,
      "title": "Morning Yoga",
      "expires_on": "2026-04-30",
      "days_until_expiry": 14,
      "has_active_enrollments": true
    }
  ]
}
```

---

## UX Flows

### Client Flow: Enrolling in a Session

```
1. Client visits /[username] (expert profile page)
   ↓
2. Sees "Consultation & Services" section (existing)
   ↓
3. Scrolls down to "Sessions & Pricing" section (new)
   ↓
4. Browses upcoming sessions
   ├─ If session has capacity:
   │    ├─ Clicks "Book Session"
   │    ├─ Auth gate (if not logged in) → signup/login modal
   │    ├─ Payment → Razorpay checkout
   │    └─ Confirmation → "You're enrolled!"
   │
   └─ If session is sold out:
        ├─ Sees "Sold Out" badge
        ├─ Clicks "Notify Me When Available"
        └─ Interest registered → "We'll notify you if spots open"
```

### Expert Flow: Publishing a Session

```
1. Expert logs into dashboard
   ↓
2. Navigates to "Sessions" (renamed from "Classes")
   ↓
3. Creates new class template OR opens existing class
   ↓
4. Adds individual session (date + time)
   ↓
5. Session created as "Draft" (not visible to clients)
   ↓
6. Expert clicks "Publish Session"
   ↓
7. Warning modal appears:
   "Once published, you cannot change date/time/location.
    Are you sure?"
   ↓
8. Expert confirms
   ↓
9. Session status → "Published" (now visible to clients)
   ↓
10. Clients can enroll
```

### Expert Flow: Cancelling a Session

```
1. Expert opens "Sessions" dashboard
   ↓
2. Selects a published session with enrollments
   ↓
3. Clicks "Cancel Session"
   ↓
4. Warning modal shows:
   "12 clients enrolled (₹6,000 total).
    Cancelling will refund all clients.
    This will impact your reliability score."
   ↓
5. Expert provides cancellation reason
   ↓
6. Expert confirms
   ↓
7. Backend:
   ├─ All enrollments → status='cancelled_expert'
   ├─ Razorpay refund API called for each enrollment
   ├─ Email notifications sent to clients
   └─ Expert reliability score updated
   ↓
8. Expert sees confirmation: "Session cancelled. Refunds processing."
```

### Expert Flow: Marking Attendance

```
1. Session completes (e.g., Monday 6 PM class ends at 7 PM)
   ↓
2. Expert receives email reminder (24h after session):
   "Please mark attendance for Monday's session"
   ↓
3. Expert opens dashboard → "Sessions" → "Recent Sessions"
   ↓
4. Clicks "Mark Attendance" on Monday's session
   ↓
5. Sees list of enrolled clients with checkboxes:
   ├─ Client A: [ ] Attended  [ ] No-show
   ├─ Client B: [ ] Attended  [ ] No-show
   └─ [ ] Session was cancelled / didn't run
   ↓
6. Expert marks each client OR marks entire session as cancelled
   ↓
7. Submits
   ↓
8. Backend:
   ├─ If "attended" → transaction complete, no refund
   ├─ If "no-show" → expert keeps payment, no refund
   └─ If "session cancelled" → auto-refund all enrollments
   ↓
9. If expert doesn't mark within 48h:
   ├─ Auto-refund triggered
   ├─ Expert reliability score decreased
   └─ Email sent: "Refunds auto-processed due to no attendance marking"
```

### Expert Flow: Renewing an Expired Class

```
1. Dashboard shows banner:
   "⚠️ 2 class templates need renewal"
   ↓
2. Expert clicks "Review Classes"
   ↓
3. Sees list:
   ├─ "Morning Yoga" expires April 30 (14 days)
   └─ "Pilates Basics" EXPIRED on April 10
   ↓
4. Expert clicks "Renew" on "Morning Yoga"
   ↓
5. Renewal modal shows:
   ├─ Current expiry: April 30, 2026
   ├─ New expiry: [date picker] (suggested: July 31)
   ├─ [ ] Keep current details (price, time, capacity)
   └─ [ ] Update details before renewing
        (only if no active enrollments)
   ↓
6. Expert selects new expiry + keeps details
   ↓
7. Confirms
   ↓
8. Class template renewed → expires_on updated
   ↓
9. Expert can now create sessions beyond April 30
```

---

## Edge Cases & Resolutions

### Edge Case 1: User Enrolls, Expert Deletes Session
**Scenario**: Client pays and enrolls. Expert immediately deletes the session.

**Resolution**:
- ❌ Deletion blocked if status='published' + has enrollments
- Expert must use "Cancel Session" instead (triggers refund flow)

---

### Edge Case 2: Expert Changes Time After Enrollment
**Scenario**: Client enrolled for 6 AM session. Expert tries to change to 7 PM.

**Resolution**:
- ❌ Edit blocked by immutability rules
- UI disables time field with tooltip: "Cannot change time - users enrolled based on 6 AM slot"
- Expert options: Cancel session OR create new session at 7 PM

---

### Edge Case 3: Expert Doesn't Mark Attendance
**Scenario**: Session happened on Monday. Expert forgets to mark attendance.

**Resolution**:
- 24h after session: Email reminder sent to expert
- 48h after session: Auto-refund triggered for all enrollments
- Expert reliability score decreased
- Email to clients: "Expert didn't confirm session. ₹500 refunded."

---

### Edge Case 4: Session Sold Out, Client Still Interested
**Scenario**: Session capacity 20, all spots filled. 21st client wants to join.

**Resolution**:
- Enrollment blocked (API returns 400)
- UI shows "Sold Out" badge
- "Notify Me When Available" button → registers interest
- Interest tracked in `session_interest` table
- Expert sees: "20 enrolled + 15 interested" in dashboard
- Phase 2: If spot opens (cancellation), notify interested users

---

### Edge Case 5: Expert Cancels <24h Before Session
**Scenario**: Session scheduled for tomorrow 6 PM. Expert cancels today at 7 PM.

**Resolution**:
- 100% refund to all clients (standard)
- PLUS ₹100 apology credit to each client (platform covers)
- Expert flagged for late cancellation
- Reliability score impacted more severely than >24h cancellation
- If 3+ late cancellations in 30 days → platform review

---

### Edge Case 6: Class Template Expires, Expert Doesn't Notice
**Scenario**: "Morning Yoga" expires April 30. Expert tries to create May 5 session.

**Resolution**:
- Session creation blocked (API returns 400)
- UI disables date picker for dates beyond April 30
- Error message: "Class expires April 30. Renew class first."
- Expert forced to renew before creating future sessions

---

### Edge Case 7: Expert Tries to Edit Price After Enrollments
**Scenario**: Session has 10 enrollments at ₹500. Expert tries to change to ₹600.

**Resolution**:
- ❌ Blocked by immutability rules
- Error: "Cannot edit price - users enrolled at ₹500"
- Expert options:
  - Wait until session completes
  - Create new session at ₹600 (separate instance)
  - Cancel session + refund (nuclear option)

---

### Edge Case 8: Client Pays, Session Happens, Expert Marks "Cancelled"
**Scenario**: Session actually ran. Expert mistakenly marks it as "cancelled."

**Resolution**:
- Auto-refund triggered (trusting expert's input)
- Expert reliability score decreased (pattern detection)
- If repeated pattern detected → platform review
- Phase 2: Client dispute mechanism ("I attended but got refunded?")

---

### Edge Case 9: Razorpay Refund Fails
**Scenario**: Auto-refund initiated but Razorpay API fails.

**Resolution**:
- Enrollment status → 'refunded' (intent recorded)
- `refund_provider_id` → NULL (indicates failure)
- Cron job retries refund daily (max 3 attempts)
- After 3 failures → manual intervention flag
- Platform support team contacts client + expert

---

### Edge Case 10: Expert Deletes Class with Future Sessions
**Scenario**: Expert has "Morning Yoga" class with 10 future sessions. 3 have enrollments. Expert clicks "Delete Class."

**Resolution**:
- Warning modal: "Will cancel 3 sessions and refund 25 clients (₹12,500 total)"
- Expert must explicitly confirm
- If confirmed:
  - All sessions with enrollments → cancelled
  - Auto-refund initiated for all enrollments
  - Email notifications to all clients
  - Class template deleted
  - Expert reliability score impacted

---

## Success Metrics

### Phase 1 Launch Targets

#### Session Engagement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Session enrollment completion rate** | >70% | (Enrollments confirmed / Session page views) |
| **Consultation booking rate** | No degradation (<5% drop) | Monitor pre/post launch |
| **Expert reliability score** | >0.90 average | Track cancellation rate + attendance marking |
| **Refund rate** | <10% of enrollments | (Refunded enrollments / Total enrollments) |
| **Client satisfaction (post-refund)** | >4.5/5 | Survey after refund processed |
| **Sessions published per expert** | >5 sessions/month (Elite tier) | Track adoption |

#### Tier Upsell Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Upgrade conversion (Free → Pro)** | 15-20% within 7 days of hitting limit | Track "tier_limit_reached" event → upgrade completion |
| **Upgrade conversion (Pro → Elite)** | 10-15% within 14 days of hitting limit | Smaller pool, higher commitment threshold |
| **Time to limit (Free)** | 30 days median | Validates Free tier limit drives timely upgrades |
| **Time to limit (Pro)** | 90 days median | Serious users have longer runway |
| **Downgrade rate after hitting limit** | <5% | Users don't churn in frustration, find value |
| **Sessions created per tier** | Free: 6-8/mo, Pro: 15-18/mo, Elite: 40-50/mo | Validates limits align with usage patterns |
| **Free tier signup rate** | No drop >10% vs pre-limit baseline | Limits aren't scaring away new users |
| **Pro tier satisfaction** | >4.2/5 | Limits aren't frustrating paying users |

### Red Flags (Abort/Rollback Criteria)

#### Session System Health
- Consultation booking rate drops >15% (sessions cannibalizing consultations)
- Refund rate >25% (trust erosion or expert reliability issues)
- Client support tickets spike >3x (UX confusion or broken flows)
- Expert reliability score <0.75 average (experts abusing cancellation)

#### Tier Upsell Health
- Upgrade conversion <8% (limits not driving upgrades, may be too lenient)
- Free tier signup drops >15% (limits scaring away new users, too restrictive)
- Downgrade rate >10% (users hitting limits and leaving platform)
- Support tickets about "unfair limits" >3% of Free/Pro users (pricing perception issue)

---

## Technical Debt & Future Considerations

### Known Limitations (Phase 1)

1. **No client-initiated cancellations**: Only expert can cancel. Client must contact support.
2. **No partial refunds**: All refunds are 100%. Timing-based refund policy in Phase 2.
3. **No dispute resolution**: If client claims "didn't happen" but expert says it did → manual review required.
4. **No waitlist auto-enrollment**: Interest tracked, but no auto-notification when spots open.
5. **Payment provider coupling**: Razorpay-specific. Abstracting payment providers in Phase 3.
6. **Tier limit caching**: Usage counts calculated on-demand. May need caching/pre-computation if >1000 experts.
7. **No tier limit "buffer"**: Hard limits with no grace period. Phase 2 may add "soft exceed" with warning.

### Scalability Considerations

- **Auto-refund cron job**: Currently runs daily. May need real-time processing if volume >1000 enrollments/day.
- **Session search**: No search/filter for sessions yet. Required if >50 active experts with sessions.
- **Bulk operations**: No batch session creation (e.g., "create every Monday for 3 months"). Manual creation only.
- **Tier limit queries**: Active class count + monthly session count queries must be <50ms at 10k experts scale.
- **Usage tracking**: Consider materialized view or cached counts for `/partners/me/tier-limits` endpoint.

### Security Considerations

- **Refund fraud**: Expert could repeatedly cancel sessions to inflate refund metrics (detection via reliability score).
- **Payment reconciliation**: Daily reconciliation job needed to detect refund API failures.
- **Client impersonation**: Manual enrollment (Phase 2) requires phone/email verification to prevent fake clients.
- **Tier limit bypass attempts**: Validate tier on every class/session creation API call (cannot trust client-side checks).
- **Race conditions**: Concurrent session creation could bypass monthly limits (use DB transaction locks).

---

## Glossary

| Term | Definition |
|------|------------|
| **Consultation** | 1:1 booking between client and expert with intake questions |
| **Session** | Group class/workshop instance (default term shown to clients) |
| **Class Template** | Recurring pattern for sessions (e.g., "Morning Yoga") |
| **Enrollment** | Client's paid registration for a specific session |
| **Publication** | Act of making a draft session visible to clients |
| **Immutability** | Locked state preventing edits to date/time/location after enrollments |
| **Expiry** | Mandatory end date for class templates forcing periodic review |
| **Reliability Score** | Expert's track record (cancellation rate, attendance marking) |
| **Sold Out** | Session at full capacity (enrolled_count >= capacity) |
| **Interest Tracking** | Recording client interest in sold-out sessions for demand visibility |
| **Display Term** | Expert's choice of terminology (session / workshop / class) |
| **Active Classes** | Class templates with status='active' AND expires_on > today |
| **Sessions/Month** | Count of published sessions within current calendar month |
| **Tier Limit** | Maximum active classes or sessions per month based on subscription tier |
| **Upgrade Conversion** | % of users who upgrade after hitting tier limit |
| **Hard Limit** | Cannot bypass restriction (e.g., cannot create 3rd class on Free tier) |
| **Soft Limit** | Graceful handling (e.g., existing classes stay active after downgrade) |

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-04-16 | Initial comprehensive documentation | System |
| 1.1 | 2026-04-16 | Added tier-based limits & upsell strategy section; updated Phase 1 scope to include tier enforcement; added tier metrics to success criteria; expanded glossary | System |

---

## Related Documentation

- [Client Manager & AI Routines](.github/instructions/client-manager-ai-routines.instructions.md)
- [Subscription Tier Enforcement](backend/tests/SUBSCRIPTION_TIER_QA_REPORT.md)
- [Payment Module](memories/repo/payment-module.md)
- [Elite Dashboard](memories/repo/dashboard-elite.md)

---

**END OF DOCUMENT**
