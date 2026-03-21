# Project Status and Vision

Last updated: 2026-03-21

## Current Status

### Completed and running in codebase
- FastAPI backend with versioned API routing and modular route groups
- Async SQLAlchemy + Alembic migration workflow
- Supabase-backed auth boundary with backend JWT verification
- Booking flow endpoints: questions, responses, payment order/verify, and booking history
- Payment provider abstraction in backend services (mock + provider-oriented design)
- Professional discovery/profile surfaces including featured and search endpoints
- Expert-review intake endpoint and holistic-team preparation/list/detail endpoints
- Frontend public route set expanded: results, expert review, holistic team flow, product/brand/wellness center/certificate-provider detail pages
- Legacy `holistic-plan` route redirected to `holistic-team`
- Internal admin app and backend admin endpoints are present
- Backend tests cover health, auth, booking auth/flow, featured card strategy, geo city resolution, and search ranking behavior

### In-progress platform direction
- Continue strengthening the listing/search/discovery loop while maintaining booking conversion quality
- Keep holistic-team journey integrated with intake answers and ranked team generation
- Maintain mobile-first UX quality across public routes

## High Priority Open Work
- Complete remaining payment hardening and reconciliation depth for production rollout
- Reduce duplicated auth state ownership on frontend where overlapping stores/providers exist
- Tighten production CORS and broader security defaults
- Expand test coverage around intake, holistic-team flows, and payment edge cases
- Finish doc hygiene by keeping one canonical tracker only

## Product Vision
Wolistic is a wellness discovery and service coordination platform with:
- trustworthy professional discovery,
- guided booking and payment,
- intake-informed holistic team recommendations,
- clear user and admin operational surfaces.

The vision remains production-first: backend-owned trust boundaries, measurable flow completion, and incremental rollout over speculative breadth.

## Canonical Docs Set
- `docs/README.md`
- `docs/AI_DONT_DELETE_ARCHITECTURE.md`
- `docs/AI_DONT_DELETE_TODO_WORKLIST.md`
- `docs/AI_DONT_DELETE_COMMANDS.md`
- `docs/AI_DONT_DELETE_OWNERSHIP_MATRIX.md`
