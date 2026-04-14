# Canonical Todo and Worklist

Last updated: 2026-04-14

This is the single source of truth for active work tracking in `docs/`.

## P0 Active Work

- [x] Payment production hardening
	- [x] Subscription upgrade payment via Razorpay inline (order + verify endpoints)
	- [x] Priority ticket raise post-upgrade (partner route)
	- [x] Cryptographic signature verification (HMAC SHA256) for all payment paths
	- [x] Webhook reconciliation paths fully tested (failure scenarios, idempotency)
	- [x] Provider references stored and exposed via admin APIs
	- [x] Structured logging for all payment operations (order, verify, webhook)
	- [x] Idempotency protection for webhook duplicate delivery
	- [x] Test mode indicator (detects rzp_test_ vs rzp_live_ key prefix)
	- [x] Admin payment history API (GET /admin/payments/booking/{reference})
	- [x] Admin subscription billing API (GET /admin/subscriptions/billing with filters)
	- [x] Subscription webhook handler (POST /partners/subscription/webhooks/razorpay)
	**Completion notes (2026-04-14):**
		- Phase 1 complete: Structured logging throughout payment service, order creation, verification, webhook processing
		- Phase 2 complete: Idempotency protection prevents duplicate webhook coin awards; 3 new tests (payment.failed, duplicate delivery, conflicting payment_id)
		- Phase 3 complete: Admin APIs require ADMIN_API_KEY, support filtering by professional_id and date ranges
		- Ready for production: Test mode auto-detected via key prefix, signatures verified on all paths, full observability

- [x] Frontend auth state consolidation
	- [x] Remove duplicated source-of-truth patterns between store/provider layers
	- [x] Keep one canonical session/profile state model
	- **Completion notes (2026-04-14):**
		- Removed Zustand session store (`frontend/store/session.ts`) entirely
		- Migrated all 7 components to use `AuthSessionProvider` (Context API) exclusively
		- Replaced manual auth state writes with `refreshSession()` pattern
		- Single source of truth: `useAuthSession()` hook for all auth state access
		- Removed `zustand` dependency from package.json
		- Zero compilation errors, all TypeScript checks passing

- [x] Production security defaults
	- [x] Add request ID middleware for request tracing (2026-04-14)
	- [x] Add environment-based structured logging (dev: human-readable, prod: JSON)
	- [x] Add environment-based CORS configuration (permissive in dev, restrictive in prod)
	- [x] Add structured logs for all sensitive workflows (2026-04-14)
		- ✅ Payment operations: order creation, verification, webhook processing (complete)
		- ✅ Auth workflows: session validation (/auth/me), onboarding updates
		- ✅ Booking workflows: question submission, booking history access
	- [x] Prometheus instrumentation for metrics collection (2026-04-14)
	**Completion notes (2026-04-14):**
		- RequestIDMiddleware provides correlation IDs across all requests
		- Environment-based logging: JSON in production, human-readable in dev
		- Structured logging added to auth routes (session, onboarding) and booking routes (answers, history)
		- Payment routes use service-layer logging (already comprehensive)
		- CORS tightening moved to P1 (blocked until production deployment)

- [x] Migration history reset (v1.1 baseline) — release tagging
	- [x] Generate and review baseline migration from current schema
	- [x] Archive pre-v1.1 migration files after baseline approval
	- [x] Stamp existing environments to v1.1 revision
	- [x] Validate fresh-db `upgrade head` path and existing-db stamped path
	- [x] Tag release and update status docs
	- **Completion notes (2026-04-14):**
		- Release tag: `v1.1.0` ("v1.1.0 baseline migration reset")
		- Baseline migration: `f577acd2eef7_v1_1_baseline_schema.py`
		- Status docs updated in AI_DONT_DELETE_PROJECT_STATUS_VISION.md
		- 13 active migrations post-baseline, pre-v1.1 migrations archived

## P1 Near-Term Product and Quality

- [ ] Holistic intake to team flow hardening
	- [x] End-to-end flow implemented and working
		- Expert-review intake → prepare holistic team → redirect with query params
		- Auth state preserved across navigation
		- Frontend: `/expert-review` → `/holistic-team` flow complete
		- Backend: `POST /intake/expert-review` and `POST /holistic-teams/prepare` endpoints live
	- [x] Route-level tests for `/api/v1/intake/expert-review` (success, error cases)
	- [ ] Add route-level tests for `/api/v1/holistic-teams/*` endpoints (prepare, list, get)
	- [x] No fallback-only behavior found in production paths

- [ ] Production CORS tightening
	- [x] Environment-based CORS configuration implemented (permissive in dev, restrictive in prod)
	- [ ] Deploy to production environment and configure restrictive CORS settings
	- [ ] Test CORS with production frontend URL
	- [ ] Validate only whitelisted origins, methods, and headers are allowed

- [x] Elite/Pro dashboard — wire live data into all dashboard sections
	- ✅ Activities: backend data connected; frontend shell ready; test coverage needed
	- ✅ Classes: backend routes live; frontend manager wired; test coverage needed
	- ✅ Clients: backend routes live; frontend Client Manager v2 fully wired; test coverage needed
	- ✅ Coins: backend rules + service live; frontend wallet wired; edge case handling needed
	- ✅ Subscription: upgrade flow complete; cancellation flow implemented
	**Completion notes (2026-04-14):**
		- Client Manager backend integration: Extended `expert_clients` table with acquisition tracking, physical metrics, engagement stats
		- New tables: `expert_client_routines`, `expert_client_routine_items` with template support and status workflows
		- API endpoints: clients/metrics, routines CRUD, template assignment, routine item updates, follow-ups
		- Frontend: Replaced mock data with real API calls in `ClientsManagerV2Page.tsx`, created `client-manager-api.ts`
		- Subscription cancel: `POST /api/v1/partners/subscription/cancel` sets status='cancelled', disables auto-renew
		- Email invitations: Client creation works but email sending deferred (provider decision pending)

- [ ] Coins economy hardening
	- [ ] Define and lock earn-rule catalog (daily checkin, booking, review) in DB
	- [ ] Add expiry-based coin accounting and reporting
	- [ ] Admin override and manual adjustment workflow

- [ ] Professional verification matrix rollout (India)
	- [ ] Finalize role-wise mandatory credential matrix: gym trainers, yoga instructors, dietitians, therapists
	- [ ] Define role-specific registry/source checks and evidence requirements per credential
	- [ ] Implement verification status model: unverified, identity-verified, credential-verified, fully-verified
	- [ ] Enforce discoverability rule: only fully-verified professionals appear in public search
	- [ ] Add role-specific public badges (no generic badge-only claims)
	- [ ] Add re-verification scheduler with expiry-based auto-downgrade/suspension rules
	- [ ] Store verification audit trail (reviewer, timestamp, source, decision, reason code)

- [ ] Increase automated test coverage
	- Subscription routes (upgrade order + verify, priority ticket)
	- Coins service (earn, redeem, daily checkin idempotency)
	- Activities and Classes (CRUD, auth boundary)
	- Clients management (professional-owned client list)

- [ ] Add pagination and query contracts where list endpoints can grow large
- [ ] Complete mobile UX audit pass for public profile, results, and booking surfaces
- [ ] Remove dead or placeholder UI actions where behavior is not implemented
- [ ] Formalize API contracts for holistic-team and intake payloads in docs
- [ ] Verification matrix legal/compliance review for claim language ("100% verified professionals")

## P2 Platform and Operations

- [x] Supabase Storage media migration — Core implementation complete (2026-04-14)
	- ✅ Feature working in production: Profile Studio upload/delete for profile photos and cover images
	- ✅ Backend API complete: upload-intent, confirm, delete, list endpoints with signed URLs
	- ✅ Canonical path contract implemented: `{actor_type}/{auth_uid}/{surface}/{yyyy}/{mm}/{uuid}.{ext}`
	- [ ] Documentation: Upload flow diagram, error handling strategies, path contract reference
	- [ ] Backfill runbook for migrating existing external URLs (operational task, if needed)
	- [ ] E2E test suite for upload → display → delete scenarios
	- **Note:** Downgraded from P0 (2026-04-14) — Core feature works; docs/tests are quality improvements, not blockers

- [x] Monitoring baseline: Prometheus `/metrics` endpoint instrumented (HTTP duration, request counts, active requests)
- [ ] Production observability integration: Connect Axiom (logs) + Grafana Cloud (metrics dashboards) after deployment
- [ ] Alert configuration for errors, latency p95/p99, payment failure rates
- [ ] Index and query plan review for high-traffic foreign keys
- [ ] Backup/restore and migration rollback drills
- [ ] Rate limiting and abuse protection strategy for public endpoints
- [ ] Caching strategy for search/discovery responses
- [ ] Performance refactor pass (see `high_priority_refactor_todo.md`)

## P3 Future Product Features (Phase 2+)

### V2 Dashboard Enhancements

- [ ] My Wolistic Teams
	- Collaboration management interface for experts working together
	- Invite/manage co-experts, team roles, and shared resources
	- Team-level activity visibility and coordination tools

- [ ] Feedback to Wolistic
	- In-dashboard feedback submission interface
	- Category-based feedback routing (feature request, bug report, general feedback)
	- Feedback history and status tracking for user submissions

- [ ] Client Manager — Favorite Clients
	- Mark/unmark clients as favorites
	- Quick-access favorite clients list or filter
	- Favorite indicator in client cards/lists

- [ ] Classes & Sessions — Work Locations Overview
	- Dedicated section listing all gyms/centers/studios where expert works
	- Location details: name, address, active class count
	- Quick navigation to location-specific classes

- [ ] Marketplace
	- Explore products: wellness products, equipment, supplements
	- Collaboration opportunities: brand partnerships, event sponsorships
	- Events: industry events, training workshops, certification programs
	- Discovery filters and search

- [ ] Classes & Sessions — Conflict Detection Details
	- Clickable conflict count indicator
	- Conflict detail modal showing:
		- Overlapping classes/sessions with time ranges
		- Location conflicts (if same location double-booked)
		- Suggested resolution actions (reschedule, cancel, adjust time)

### Other Phase 2+ Features

- [ ] In-app messaging system (professional ↔ client communication)
	- Real-time messaging infrastructure (WebSocket, message storage, notifications)
	- Professional-client chat UI with message history
	- Negotiation support for "negotiable" services: in-chat price negotiation → "Book at ₹X" action link
	- Reusable for all professional-client communication (pre-booking questions, post-booking follow-up, etc.)
	- Mobile push notification integration
	- Message moderation/safety tooling
	- Estimated effort: ~10+ backend tasks + ~8+ frontend tasks

## Done Recently (Tracked Summary)

- [x] Backend JWT verification and authenticated identity boundary
- [x] Booking payment provider abstraction and backend-owned verify contract
- [x] Booking reference generation moved server-side
- [x] Booking history shaped for immediate/upcoming/past rendering
- [x] Professional search endpoint and ranking test coverage
- [x] Results UX improvements (sticky behavior, category filtering, pagination, loading skeleton)
- [x] Expert-review intake route and holistic-team route family connected
- [x] Professional extended fields migration (`a1b2c3d4e5f6`)
- [x] Catalog tables migration and catalog routes (`a91c5e12d3f4`)
- [x] Legacy holistic_plans table dropped (`b7f42c9d1a61`)
- [x] Coin system — DB tables, service, earn/redeem/history routes, daily checkin (`e53c8a2b7d41`, `f81d3c9e0a55`)
- [x] Activity manager — DB tables, backend routes, frontend `ActivityManagerPage` with tutorial (`c9d8e7f6a5b4`)
- [x] Classes manager — DB tables + work locations, backend routes, frontend `ClassesManagerPage` (`i45k6l7m8n9o`)
- [x] Clients manager — DB tables, backend routes, frontend `ClientsManagerPage` (`g12h3i4j5k6l`)
- [x] Professional settings — DB table, backend routes, frontend `SettingsPage` (`h34j5k6l7m8n`)
- [x] Subscription system — DB tables, backend routes, Razorpay upgrade order + verify, priority ticket (`j56l7m8n9o0p`, `k67m8n9o1p2q`)
- [x] Elite dashboard v2 — shell layout, `EliteSideNav`, `EliteTopHeader`, `BodyExpertDashboardContent`, `WolisticCoinsPage`, `SubscriptionPage`
- [x] Partner dashboard — backend KPI routes, frontend `PartnerDashboardPage`
- [x] Profile studio redesign — `ProfileStudioPage`, `ProfileStudioSidePanel`, new identity/social and practice sections
- [x] `celeb` tier added to `SubscriptionTier` union; compare-plans grid with celeb column
- [x] `media_assets` table in migration chain (`d42b5f3a1c90`)

## Consolidation Notes

- Legacy scattered todo files were removed from `docs/` on 2026-03-21.
- If a new work item appears, add it here instead of creating a new todo markdown file.
- `high_priority_refactor_todo.md` tracks the dedicated performance refactor backlog.
