# Architecture Overview

Last updated: 2026-03-22

## Stack
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: FastAPI, SQLAlchemy 2 async, Alembic
- Data: Supabase Postgres (UUID-first identity model)
- Auth: Supabase Auth on frontend, JWT verification in backend
- Runtime: Docker and Docker Compose for local/containerized runs

## Monorepo Structure
```
wolistic.com/
|- frontend/       # Public app + user-facing authenticated surfaces
|- backend/        # FastAPI APIs, services, models, migrations, tests
|- wolistic-admin/ # Internal admin dashboard app
`- docs/           # Architecture, status, commands, and canonical worklist
```

## Backend Routing Topology
Aggregated in `backend/app/api/router.py`.

### Core platform
- Health: `/api/v1/healthz`, `/api/v1/readyz`, `/api/v1/health` (legacy)
- Auth: `/api/v1/auth/me`, `/api/v1/auth/onboarding`
- Professionals:
	- `/api/v1/professionals/featured`
	- `/api/v1/professionals/search`
	- `/api/v1/professionals/by-id/{professional_id}`
	- `/api/v1/professionals/{professional_id}/reviews`
	- `/api/v1/professionals/{username}`
	- `/api/v1/professionals/me/editor` (GET/PUT)
- Favourites: `/api/v1/favourites/{professional_id}` (GET/POST/DELETE)

### Booking and payments
- Questions: `/api/v1/booking/questions/{professional_username}`
- Question responses: `/api/v1/booking/questions/{professional_username}/responses`
- Promotions eligibility: `/api/v1/booking/promotions/{professional_username}/eligibility`
- Payment order and verify: `/api/v1/booking/payments/order`, `/api/v1/booking/payments/verify`
- Razorpay webhook: `/api/v1/booking/payments/webhooks/razorpay`
- Booking history: `/api/v1/booking/history/me`

### Discovery and intake
- Intake: `/api/v1/intake/expert-review`
- Holistic teams:
	- `/api/v1/holistic-teams` (list/create)
	- `/api/v1/holistic-teams/prepare`
	- `/api/v1/holistic-teams/{team_id}`
	- `/api/v1/holistic-teams/backfill`
- Search parse: `/api/v1/search/parse`
- AI wolistic search: `/api/v1/ai/wolistic-search`
- Products featured: `/api/v1/products/featured`
- Wellness centers featured: `/api/v1/wellness-centers/featured`

### Admin
- Internal admin APIs under `/api/v1/admin/*` (status/tier actions and bulk review operations)

## Frontend Routing Topology
- Public routes in `frontend/app/(public)`:
	- Landing, results, expert review, username profile page, product/brand/wellness-center/certificate-provider detail routes
	- `holistic-plan` now acts as a legacy redirect to `holistic-team`
- Authenticated user surface in `frontend/app/authorized`
- Dashboard surfaces in `frontend/app/(dashboard)`
- Internal admin app is isolated in `wolistic-admin`

### Auth UX Surfaces
- Header-triggered auth actions (Sign In/Get Started) use modal auth.
- Non-header protected flows use right-side sidebar auth as the default surface.
- Shared trigger components (for example, `OpenAuthButton`) open sidebar auth by default.

## Identity and Trust Boundaries
- Frontend uses Supabase session tokens.
- Backend derives authenticated user identity from bearer JWT and enforces server-side ownership.
- Privileged workflow transitions (booking responses, payment state, booking history, admin actions) are backend-owned.

## Data Model Principles
- `users.id` is the global UUID anchor.
- `professionals.user_id` reuses user UUID ownership.
- Booking/payment data uses backend-generated references for safer state transitions.
- Discovery/profile data is normalized across related professional child tables.

## Operational Notes
- Asyncpg compatibility with pooler mode is handled in runtime settings.
- Backend remains stateless and environment-driven.
- Existing automated backend tests currently cover health, auth identity, booking authorization, booking flow behavior, geo city resolution, featured strategy, and professional search ranking.
- Active migration chain includes expert-review persistence table setup via `backend/alembic/versions/c3d9f0a4e8b2_add_expert_review_requests_table.py`.

## Known Gaps
- Payment hardening is not fully complete (final webhook/reconciliation depth and production verification controls still need finishing).
- Documentation was consolidated on 2026-03-21; older scattered todo files were intentionally removed.

## Related Docs
- `docs/AI_DONT_DELETE_PROJECT_STATUS_VISION.md`
- `docs/AI_DONT_DELETE_TODO_WORKLIST.md`
- `docs/AI_DONT_DELETE_OWNERSHIP_MATRIX.md`
