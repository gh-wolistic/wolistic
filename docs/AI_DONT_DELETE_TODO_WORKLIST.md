# Canonical Todo and Worklist

Last updated: 2026-03-21

This is the single source of truth for active work tracking in `docs/`.

## P0 Active Work
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
