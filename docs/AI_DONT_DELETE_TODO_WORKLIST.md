# Canonical Todo and Worklist

Last updated: 2026-04-12

This is the single source of truth for active work tracking in `docs/`.

## P0 Active Work

- [ ] Supabase Storage media migration (dashboard-scoped upload/delete only)
	- [x] Next.js image optimization host allowlist configured for Supabase Storage objects
	- [x] `ImageWithFallback` migrated to `next/image` with fallback handling
	- [x] `sizes` tuning started on key results/profile cards to reduce over-fetch
	- [x] Buckets created for media domains (`wolistic-media-profile`, `wolistic-media-feed`)
	- [x] Bucket policies configured for authenticated owner-scoped access
	- [x] DB migration for `media_assets` table in place (`d42b5f3a1c90`)
	- [ ] Canonical object path contract finalized and documented
		- Required format: `{actor_type}/{auth_uid}/{surface}/{yyyy}/{mm}/{uuid}.{ext}`
		- Allowed `actor_type`: `clients`, `partners`
		- Allowed `surface`: `profile`, `cover`, `gallery`, `feed`
	- [ ] Frontend dashboard-only upload UX implemented
		- Partner dashboard: profile/cover/gallery upload + delete actions
		- Client dashboard: feed/media upload + delete actions
		- Remove manual URL entry paths in dashboard editors once upload UX is live
	- [ ] Backend media contract implemented (production-safe)
		- Create upload intent endpoint (path validation, mime/size validation)
		- Confirm upload endpoint (persist metadata and ownership)
		- Delete media endpoint (owner auth + DB/storage consistency)
	- [ ] Private-read strategy completed
		- Signed read URL generation with bounded TTL
		- URL refresh behavior for expired assets on dashboard/public surfaces
	- [ ] Backfill + cleanup runbook executed
	- [ ] Testing and rollout gates completed

- [ ] Payment production hardening
	- [x] Subscription upgrade payment via Razorpay inline (order + verify endpoints)
	- [x] Priority ticket raise post-upgrade (partner route)
	- [ ] Confirm cryptographic signature verification and strict failure handling for all payment paths
	- [ ] Ensure webhook reconciliation paths are fully tested and observable
	- [ ] Persist and expose provider references needed for support/debug workflows

- [ ] Holistic intake to team flow hardening
	- [ ] Validate end-to-end expert-review intake to holistic-team redirect behavior across auth states
	- [ ] Add route-level tests for `/api/v1/intake/expert-review` and `/api/v1/holistic-teams/*`
	- [ ] Remove any remaining fallback-only behavior in production paths

- [ ] Frontend auth state consolidation
	- [ ] Remove duplicated source-of-truth patterns between store/provider layers
	- [ ] Keep one canonical session/profile state model

- [ ] Production security defaults
	- [ ] Tighten CORS methods/headers/origins for production
	- [ ] Add or verify request IDs and structured logs for sensitive workflows

- [ ] Migration history reset (v1.1 baseline) — release tagging
	- [x] Generate and review baseline migration from current schema
	- [x] Archive pre-v1.1 migration files after baseline approval
	- [x] Stamp existing environments to v1.1 revision
	- [x] Validate fresh-db `upgrade head` path and existing-db stamped path
	- [ ] Tag release and update status docs

## P1 Near-Term Product and Quality

- [ ] Elite/Pro dashboard — wire live data into all dashboard sections
	- Activities: backend data connected; frontend shell ready; test coverage needed
	- Classes: backend routes live; frontend manager wired; test coverage needed
	- Clients: backend routes live; frontend manager wired; test coverage needed
	- Coins: backend rules + service live; frontend wallet wired; edge case handling needed
	- Subscription: upgrade flow complete; downgrade/cancellation flow not yet built

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

- [ ] Monitoring baseline (errors, latency, payment failure alerts)
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
