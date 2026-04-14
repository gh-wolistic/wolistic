# Project Status and Vision

Last updated: 2026-04-14

## Current Status

### Completed and running in codebase

**Infrastructure and auth**
- Migration history reset to v1.1 baseline (`f577acd2eef7`) with archived pre-v1.1 revisions
- FastAPI backend with versioned API routing and modular route groups
- Async SQLAlchemy + Alembic migration workflow (13 active migrations after baseline)
- Supabase-backed auth boundary with backend JWT verification
- Docker backend images support optional dev dependencies; pytest runs in containers

**Discovery and booking**
- Professional discovery/profile surfaces including featured, search, and detail endpoints
- Booking flow endpoints: questions, responses, payment order/verify, and booking history
- Payment provider abstraction (mock + production-oriented design)
- Expert-review intake endpoint and holistic-team preparation/list/detail endpoints

**Subscriptions and coins**
- Subscription tier system: Free / Pro / Elite tiers; `celeb` tier defined
- Subscription upgrade flow: Razorpay inline payment (order + verify), priority ticket raise (partner route)
- Subscription cancellation: `POST /api/v1/partners/subscription/cancel` sets status='cancelled', disables auto-renew, keeps access until period ends
- `SubscriptionPaymentOrder` and `SubscriptionPriorityTicket` DB models and routes live
- Coins system: earn rules, daily checkin, redemption, wallet, history — backend service + frontend components fully connected

**Partner and professional management**
- Activities manager — backend CRUD routes + frontend `ActivityManagerPage` with onboarding tutorial
- Classes manager — backend routes + frontend `ClassesManagerPage` (schedule, locations)
- Clients manager — backend routes + frontend `ClientsManagerV2Page` fully wired with real data
  - Client acquisition tracking (expert_invite, organic_search, corporate_event, wolistic_recommendation, wolistic_lead)
  - Routine management with template support (draft→under_review→approved→published→archived workflow)
  - Routine items (exercise, hydration, mobility) with completion tracking
  - Dashboard metrics (total_clients, active_clients, followups_due, leads_pending)
  - Bulk template assignment to multiple clients
- Professional settings — backend route + frontend `SettingsPage`
- Professional extended fields migration (`a1b2c3d4e5f6`) applied
- Partner dashboard — backend KPI routes + frontend `PartnerDashboardPage`

**Dashboard surfaces**
- Dashboard v2 introduced: `EliteBodyExpertShell`, `EliteSideNav`, `EliteTopHeader`, `BodyExpertDashboardContent`
- `WolisticCoinsPage`, `SubscriptionPage` wired with live backend
- Profile studio redesign: `ProfileStudioPage`, `ProfileStudioSidePanel`, new identity/social and practice sections

**Public routes and frontend**
- Public route set: results, expert review, holistic team flow, product/brand/wellness center/certificate-provider detail pages
- Legacy `holistic-plan` route redirected to `holistic-team`
- Auth UX split enforced: header auth actions use modal; non-header protected flows use sidebar auth
- Holistic-team and booking auth-required actions preserve context and resume after authentication

**Media**
- `media_assets` DB table in migration chain (`d42b5f3a1c90`)
- Supabase Storage buckets configured with authenticated owner-scoped access policies
- Profile and cover image upload/delete fully implemented in Profile Studio
- Backend media API complete: upload-intent, confirm, delete, list endpoints
- Signed URL generation with 10-minute cache and 24h TTL for private reads
- Gallery and feed media upload deferred to Phase 2+ (feature not yet started)

**Admin**
- Internal admin app and backend admin endpoints present
- Backend tests cover health, auth, booking, featured card strategy, geo city resolution, search ranking, partner dashboard

### Active migration chain (post-baseline)
| Migration | Description |
|---|---|
| `a1b2c3d4e5f6` | Professional extended fields |
| `a91c5e12d3f4` | Catalog tables |
| `b7f42c9d1a61` | Drop legacy holistic_plans |
| `c3d9f0a4e8b2` | Expert review requests table |
| `c9d8e7f6a5b4` | Activity tables |
| `d42b5f3a1c90` | Media assets table |
| `e53c8a2b7d41` | Coin system tables |
| `f81d3c9e0a55` | Client coin rules |
| `g12h3i4j5k6l` | Client management tables |
| `h34j5k6l7m8n` | Professional settings table |
| `i45k6l7m8n9o` | Classes and work locations tables |
| `j56l7m8n9o0p` | Subscription tables |
| `k67m8n9o1p2q` | Subscription payment and ticket tables |
| `l01m2n3o4p5q` | Expert client routines and items (Client Manager v2) |

### In-progress platform direction
- ✅ Wire live data into all elite dashboard sections (activities, classes, clients) — COMPLETE (2026-04-14)
  - Client Manager v2 fully integrated with backend (acquisition tracking, routines, templates, follow-ups)
  - Subscription cancel flow implemented
  - Test coverage still pending for all dashboard sections
- Coins economy hardening: earn-rule catalog, expiry accounting, admin overrides
- ✅ Payment hardening: COMPLETE — cryptographic signature verification, webhook reconciliation, provider references, structured logging
- Maintain mobile-first UX quality across all public and dashboard routes

## High Priority Open Work
- ✅ Payment hardening COMPLETE: signature verification, webhook reconciliation, structured logging, idempotency
- ✅ Elite dashboard data wiring COMPLETE: Client Manager v2 backend integration, subscription cancel flow
- Coins economy: lock earn-rule catalog, add expiry accounting, admin tools
- Media upload: documentation, backfill runbook, E2E testing gates (profile/cover complete)
- Add route-level tests for holistic-teams endpoints (intake tests complete; prepare/list/get pending)
- Tighten production CORS after deployment (implementation ready, blocked by production URL)
- Expand test coverage: subscription, coins, activities, classes, clients (client manager backend live, tests pending)
- Professional verification matrix design and rollout strategy

## Product Vision
Wolistic is a wellness discovery and service coordination platform with:
- trustworthy professional discovery,
- guided booking and payment,
- intake-informed holistic team recommendations,
- rich professional dashboards (activities, classes, clients, coins, subscriptions),
- clear user and admin operational surfaces.

The vision remains production-first: backend-owned trust boundaries, measurable flow completion, and incremental rollout over speculative breadth.

## Canonical Docs Set
- `docs/README.md`
- `docs/AI_DONT_DELETE_ARCHITECTURE.md`
- `docs/AI_DONT_DELETE_TODO_WORKLIST.md`
- `docs/AI_DONT_DELETE_COMMANDS.md`
- `docs/AI_DONT_DELETE_OWNERSHIP_MATRIX.md`
- `docs/high_priority_refactor_todo.md`
