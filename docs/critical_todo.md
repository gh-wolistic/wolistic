# Critical Todo List — wolistic.com Code Review
_Generated: March 12, 2026_
_Reviewed: March 13, 2026_

---

## 🔴 CRITICAL — Security

- [x] **Add JWT authentication to backend** — FastAPI now verifies Supabase bearer tokens in `backend/app/core/auth.py` and server-side user identity is used by booking endpoints instead of client-supplied `user_id` values.

- [ ] **Fix payment verification — IDOR + client-controlled outcome** — Implement HMAC-SHA256 Razorpay signature verification using the Razorpay key secret. Remove the `mock_status` field from `VerifyPaymentIn` entirely in production. Currently the client decides whether their own payment succeeded.

- [x] **Remove email from public API and JSON-LD** — `email` has been removed from the public professional API contract and public frontend profile type; the public profile page no longer exposes it.

- [x] **Implement `GET /api/v1/auth/me` endpoint** — The backend now exposes `/api/v1/auth/me` and the existing frontend resolver can enrich auth session state from backend-owned profile fields.

- [x] **Fix `booking_reference` replay attack** — `create_payment_order` now generates `booking_reference` server-side and no longer accepts a client-provided booking reference.

---

## 🟠 HIGH — Bugs & Data Integrity

- [x] **Fix immediate bookings missing from history** — Booking history now returns a dedicated `immediate_bookings` collection and the authorized page renders it.

- [ ] **Remove dual session state** — `frontend/store/session.ts` (Zustand) and `frontend/components/auth/AuthSessionProvider.tsx` (React context) both independently track auth state and can fall out of sync. Pick one source of truth and remove the other.

- [ ] **Fix availability round-trip antipattern** — `_derive_availability_string` in `professionals.py` converts structured slots to a flat string. `useBookingSchedule.ts` then parses that string back to structured data using regex. Return structured `availability_slots` from the API instead.

- [ ] **`is_online` has two sources of truth** — The stored `is_online` column is ignored at read time; `_flatten_professional` always re-derives it from `last_active_at`. Either remove the column or use it as the authoritative value.

- [ ] **`education` always returns `[]`** — `_flatten_professional` never populates the education list despite the `professional_education` table existing. The `lazy="noload"` setting on the relationship needs to be changed and the mapper updated.

- [x] **`authorized/page.tsx` bypasses the data layer** — The authorized page now loads booking history through `frontend/components/public/data/bookingApi.ts`.

---

## 🟡 MEDIUM — Architecture & Coverage

- [ ] **Add `GET /professionals` list endpoint** — No browse/search/paginate endpoint exists. The homepage cannot show a directory of professionals. Add pagination, search by name/specialization, and filter by category.

- [x] **Add JWT-protected booking endpoints index** — The architecture docs now list the current booking endpoint access model: optional auth for question lookup, required auth for answer submission, payment creation/verification, and history retrieval.

- [ ] **Add database indexes on FK columns** — PostgreSQL does not auto-index foreign keys. Add explicit indexes on `professional_id` and `client_user_id` across all child tables (`booking_question_responses`, `booking_question_templates`, `bookings`, `booking_payments`, and all `professional_*` child tables).

- [ ] **Move seed data out of migrations** — `20260307_0003_seed_professional_tables.py` seeds Dr. Sarah Chen inside an Alembic migration. Extract seed rows into a separate `scripts/seed.sql` or `scripts/seed.py`. Keep migrations schema-only.

- [ ] **Add backend test coverage** — Add `pytest-asyncio` to `requirements-dev.txt`. Add an async DB fixture. Write route-level tests for: booking question fetch, booking answer submit, payment order creation, payment verification, professional profile fetch, booking history.

- [ ] **Add pagination to booking history** — `get_booking_history` is capped at `limit(100)` with no `offset`/cursor. Add proper pagination parameters.

- [ ] **Implement or delete `authApi.ts`** — `frontend/components/public/data/authApi.ts` throws `"not implemented yet"` for all functions. Either implement it or delete it and remove all imports before it causes a runtime crash.

- [ ] **Tighten CORS configuration** — `allow_methods=["*"]` and `allow_headers=["*"]` in `backend/app/main.py` should be locked to the specific methods (GET, POST) and headers the API actually uses in production.

---

## 🔵 LOW — Code Quality & Cleanup

- [ ] **Delete `frontend/components/auth-modal.tsx` stub** — The file returns `null` and has an incomplete `handleEmailSignUp`. The real implementation is `components/auth/AuthModal.tsx`. Update any wrong imports.

- [ ] **Fix `get_db_session` — missing rollback on error** — `backend/app/core/database.py` should wrap the session yield in `try/finally` with `session.rollback()` to handle partially-flushed state on exceptions. Also add `AsyncGenerator[AsyncSession, None]` return type annotation.

- [x] **Fix `BookingPayment.amount` type mismatch** — `BookingPayment.amount` now uses `Mapped[Decimal]` to match `Numeric(10, 2)`.

- [ ] **Add precision/scale to `Professional.rating_avg`** — Bare `Numeric` without `(precision, scale)` should be `Numeric(3, 2)`.

- [ ] **Replace magic `.limit(2)` with a named constant** — The constant `2` (max booking questions per professional) appears in multiple places in `booking.py` routes. Define `MAX_BOOKING_QUESTIONS = 2` at module level.

- [ ] **Extract `_flatten_professional` to a mapper** — The 30+ field procedural function in `professionals.py` is hard to maintain. Move it to a mapper method on `ProfessionalProfileOut` or a dedicated `mappers.py` module.

- [ ] **Fix bio truncation at word boundary** — `getProfessionalShortBio()` in `frontend/lib/professionalBio.ts` truncates at 220 characters which can cut mid-word. Use `lastIndexOf(' ', 220)` to break at the last space.

- [ ] **Disable React Compiler until stable** — `next.config.ts` has `reactCompiler: true`. This is still experimental. Set to `false` until the feature reaches stable and the component tree is tested against it.

- [ ] **Remove `mock_status` / magic payment selector from UI** — `frontend/components/public/expertdetails/sections/booking-steps/PaymentStep.tsx` exposes a mock payment outcome dropdown. This must be removed before any public launch.

- [ ] **Document the `payment-status` redirect delay** — The 2200ms hardcoded delay in `frontend/app/(public)/payment-status/page.tsx` has no explanation. Add a comment or replace with a named constant `REDIRECT_DELAY_MS`.

- [ ] **Fix code duplication in `verify_payment`** — The booking-creation fallback block in `verify_payment` is copy-pasted from `create_payment_order`. Extract to a shared `_get_or_create_booking()` helper.

- [ ] **Remove `featured_products: []` placeholder from API** — The field always returns `[]` because the table doesn't exist yet. Remove it from `ProfessionalProfileOut` and the frontend `ProfessionalProfile` type until the feature is built, to avoid dead UI code.
