# Project Status & Vision

## Current Status (March 13, 2026)

### ✅ Completed Foundation
- [x] FastAPI backend, Docker setup, async SQLAlchemy, and Alembic migrations
- [x] Supabase Postgres connectivity via PgBouncer-compatible async configuration
- [x] Public professional profile endpoint and review endpoint
- [x] Booking question, payment-order, payment-verify, and history endpoints
- [x] Supabase JWT verification in the backend for protected booking and auth routes
- [x] Authenticated `GET /api/v1/auth/me` endpoint for frontend session enrichment
- [x] Public profile page metadata and profile rendering flow
- [x] Public results route shell for future multi-scope search
- [x] Backend tests covering health, auth identity lookup, booking auth boundaries, and selected booking-flow behavior

### 🔧 Current Working State
- Backend API is structured under `/api/v1`.
- Frontend public layout uses Supabase session state plus backend profile enrichment.
- Public professional pages and authorized booking-history pages are wired end to end.
- Booking history now separates immediate bookings from scheduled upcoming/past bookings.
- Booking references are generated server-side during payment order creation.

### 🚧 Important Open Gaps
- Razorpay verification is still mock-oriented and not cryptographically validated yet.
- `authApi.ts` remains a stub, so some booking-flow auth actions are not production-ready.
- The professionals list/search API still does not exist.
- CORS is still broader than production should allow.
- Some state management remains duplicated between Zustand and the auth context.

## Product Summary
Wolistic is a wellness discovery and booking platform combining:
- public professional discovery pages,
- guided booking and payment flows,
- authenticated session-aware user experiences,
- future multi-scope search across professionals, products, influencers, and related wellness entities.

## Near-Term Product Direction
- Complete payment hardening and remove mock verification paths.
- Finish role/profile-backed auth operations in the frontend data layer.
- Add search/list endpoints and production-grade filtering for professionals.
- Continue tightening backend ownership of all privileged state and workflow transitions.

## Doc Ownership
Use the following as the maintained reference set:
- `AI_DONT_DELETE_ARCHITECTURE.md` for current system design and endpoint boundaries
- `AI_DONT_DELETE_TODO_WORKLIST.md` for broader roadmap and platform work
- `critical_todo.md` for active code-review follow-ups and correctness/security gaps
