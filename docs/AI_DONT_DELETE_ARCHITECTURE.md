# Architecture Overview

## Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI
- **Backend**: FastAPI, async SQLAlchemy 2, Alembic
- **Database**: Supabase Postgres with UUID-based user and professional ownership
- **Auth**: Supabase Auth in frontend, FastAPI bearer-token verification for protected API routes
- **Infrastructure**: Docker, Docker Compose, Supabase PgBouncer transaction pooler

## Current Structure
```
wolistic.com/
├── frontend/
│   ├── app/
│   │   ├── (public)/                 # Public marketing, profile, payment, results routes
│   │   ├── authorized/               # Authenticated booking history page
│   │   └── layout.tsx                # Root layout and metadata
│   ├── components/
│   │   ├── auth/                     # Session provider, auth modal, backend profile resolver
│   │   ├── public/                   # Public shell, results UI, expert details flow
│   │   └── ui/                       # Shared UI primitives
│   ├── lib/
│   ├── store/
│   └── types/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── router.py             # API v1 aggregation
│   │   │   └── routes/
│   │   │       ├── auth.py           # Authenticated profile endpoint
│   │   │       ├── booking.py        # Booking questions, payment, history
│   │   │       ├── health.py         # Liveness/readiness endpoints
│   │   │       └── professionals.py  # Public professional profile endpoints
│   │   ├── core/
│   │   │   ├── auth.py               # Supabase JWT verification helpers
│   │   │   ├── config.py             # Pydantic settings
│   │   │   └── database.py           # Async engine/session setup
│   │   ├── models/
│   │   └── schemas/
│   ├── alembic/
│   └── tests/
└── docs/
```

## Backend API Surface

### Public or optionally-authenticated routes
- `GET /api/v1/healthz`
- `GET /api/v1/readyz`
- `GET /api/v1/health` (legacy/deprecated)
- `GET /api/v1/professionals/by-id/{professional_id}`
- `GET /api/v1/professionals/{professional_id}/reviews`
- `GET /api/v1/professionals/{username}`
- `GET /api/v1/booking/questions/{professional_username}`
	Optional auth is used here only to determine whether required questions were already answered.

### Authenticated routes
- `GET /api/v1/auth/me`
- `POST /api/v1/booking/questions/{professional_username}/responses`
- `POST /api/v1/booking/payments/order`
- `POST /api/v1/booking/payments/verify`
- `GET /api/v1/booking/history/me`

## Auth Boundary
- Frontend signs users in with Supabase and keeps the access token client-side.
- FastAPI verifies Supabase bearer tokens in `backend/app/core/auth.py`.
- Protected backend endpoints derive `current_user.user_id` server-side and do not trust client-supplied user identifiers.
- The frontend auth session is enriched through `GET /api/v1/auth/me` so UI state can use backend-owned identity fields.

## Booking Flow Architecture
- Question lookup is read-only and can be called before login, but returns richer state when a bearer token is present.
- Answer submission, order creation, payment verification, and history retrieval all require authenticated backend identity.
- `create_payment_order` now generates `booking_reference` server-side to prevent client replay/overwrite attacks.
- Booking history now returns `latest_booking`, `next_booking`, `immediate_bookings`, `upcoming_bookings`, and `past_bookings`.
- `BookingPayment.amount` is modeled as `Decimal` in Python to match `NUMERIC(10, 2)` in Postgres.

## Frontend Architecture
- Public routes are wrapped by `PublicLayoutClient`, which composes `AuthSessionProvider` and `AuthModalProvider`.
- `AuthSessionProvider` can enrich the Supabase session with backend profile data from `/api/v1/auth/me`.
- Expert profile pages render a client booking flow with schedule, required questions, auth, and payment steps.
- A public `/results` route exists as a modular UI shell for future multi-scope search (`professionals`, `products`, `influencers`, and planned scopes).

## Data Model Notes
- `users.id` is the global UUID identity anchor.
- `professionals.user_id` reuses the user UUID as its primary key.
- Booking tables include questions, responses, bookings, and booking payments.
- Professional detail content is normalized across child tables such as services, certifications, languages, availability, reviews, and gallery items.

## Operational Notes
- PgBouncer compatibility is preserved with `statement_cache_size=0`.
- CORS is currently permissive enough for development and should still be tightened for production.
- The backend remains stateless and environment-driven.
- Current tests cover health routes, auth identity lookup, booking auth boundaries, and selected booking-flow behavior.

## Near-Term Gaps
- Real Razorpay signature verification is still pending.
- `authApi.ts` remains a frontend stub for several auth-adjacent operations.
- The professionals list/search endpoint does not yet exist.
- Some docs and code still reflect an intermediate state around session ownership and role modeling.

## Ownership Matrix
See `AI_DONT_DELETE_OWNERSHIP_MATRIX.md` for the preferred split between direct Supabase usage and FastAPI-owned privileged logic.
