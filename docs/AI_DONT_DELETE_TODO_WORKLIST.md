# Canonical Todo and Worklist

Last updated: 2026-03-23

This is the single source of truth for active work tracking in `docs/`.

## P0 Active Work
- [ ] Supabase Storage media migration (dashboard-scoped upload/delete only)
	- [x] Next.js image optimization host allowlist configured for Supabase Storage objects
	- [x] `ImageWithFallback` migrated to `next/image` with fallback handling
	- [x] `sizes` tuning started on key results/profile cards to reduce over-fetch
	- [x] Buckets created for media domains (`wolistic-media-profile`, `wolistic-media-feed`)
	- [x] Bucket policies configured for authenticated owner-scoped access
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
	- [ ] Data model migration completed
		- Introduce canonical media metadata table (bucket, object_path, owner_user_id, mime, size, dimensions, timestamps)
		- Link profile/cover/gallery/feed records to canonical media references
		- Preserve backward compatibility during transition window
	- [ ] Private-read strategy completed
		- Signed read URL generation with bounded TTL
		- URL refresh behavior for expired assets on dashboard/public surfaces
	- [ ] Backfill + cleanup runbook executed
		- Migrate legacy URL fields to canonical storage references
		- Validate no orphaned DB records and no orphaned storage objects
	- [ ] Testing and rollout gates completed
		- Policy enforcement tests (cross-user access denied)
		- Upload/delete happy-path and failure-path tests
		- Phased rollout: partner profile -> partner gallery -> client feed
- [ ] Migration history reset (v1.1 baseline)
	- [x] Generate and review baseline migration from current schema
	- [x] Archive pre-v1.1 migration files after baseline approval
	- [x] Stamp existing environments to v1.1 revision
	- [x] Validate fresh-db `upgrade head` path and existing-db stamped path
	- [ ] Tag release and update status docs
- [ ] Payment production hardening
	- [ ] Confirm cryptographic signature verification and strict failure handling for verification paths
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

## P1 Near-Term Product and Quality
- [ ] Professional verification matrix rollout (India)
	- [ ] Finalize role-wise mandatory credential matrix for: gym trainers, yoga instructors, dietitians, therapists
	- [ ] Define role-specific registry/source checks and evidence requirements per credential
	- [ ] Implement verification status model: unverified, identity-verified, credential-verified, fully-verified
	- [ ] Enforce discoverability rule: only fully-verified professionals appear in public search
	- [ ] Add role-specific public badges (no generic badge-only claims)
	- [ ] Add re-verification scheduler with expiry-based auto-downgrade/suspension rules
	- [ ] Store verification audit trail (reviewer, timestamp, source, decision, reason code)
	- [ ] Add random secondary audit sampling and fraud escalation workflow
	- [ ] Publish internal reviewer SOP and reason-code taxonomy
- [ ] Verification matrix legal/compliance review for claim language ("100% verified professionals")
- [ ] Increase booking and discovery automated test coverage
- [ ] Add pagination and query contracts where list endpoints can grow large
- [ ] Complete mobile UX audit pass for public profile, results, and booking surfaces
- [ ] Remove dead or placeholder UI actions where behavior is not implemented
- [ ] Formalize API contracts for holistic-team and intake payloads in docs

## P2 Platform and Operations
- [ ] Monitoring baseline (errors, latency, payment failure alerts)
- [ ] Index and query plan review for high-traffic foreign keys
- [ ] Backup/restore and migration rollback drills
- [ ] Rate limiting and abuse protection strategy for public endpoints
- [ ] Caching strategy for search/discovery responses

## Done Recently (Tracked Summary)
- [x] Backend JWT verification and authenticated identity boundary
- [x] Booking payment provider abstraction and backend-owned verify contract
- [x] Booking reference generation moved server-side
- [x] Booking history shaped for immediate/upcoming/past rendering
- [x] Professional search endpoint and ranking test coverage
- [x] Results UX improvements (sticky behavior, category filtering, pagination, loading skeleton)
- [x] Expert-review intake route and holistic-team route family connected

## Consolidation Notes
- Legacy scattered todo files were removed from `docs/` on 2026-03-21.
- If a new work item appears, add it here instead of creating a new todo markdown file.
