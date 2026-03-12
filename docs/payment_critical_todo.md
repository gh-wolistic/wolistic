# Payment Critical Todo
_Generated: March 13, 2026_

---

## Goal
Move Wolistic from the current development mock payment flow to a production-safe Razorpay integration without changing the overall frontend flow shape.

The stable flow should remain:
1. Create payment order from backend
2. Open checkout or simulate payment in development
3. Send verification payload to backend
4. Let backend decide final payment and booking state

---

## Phase 1 — Stabilize Development Mock Flow

- [x] **Keep payment authority on the backend** — Mock verification is now resolved server-side through the backend payment provider instead of a client-selected outcome.

- [x] **Remove visible mock outcome controls from the public UI** — The public payment step no longer exposes mock success/failure/pending controls; mock resolution is no longer selected in the booking UI.

- [x] **Remove `mock_status` from public contract when payment hardening starts** — The verify request schema no longer includes `mock_status`; browser payloads no longer choose success, failure, or pending.

- [ ] **Keep the backend payment response shape stable** — The frontend should continue using one response contract for order creation: `mode`, `key_id`, `order_id`, `booking_reference`, `amount_subunits`, `currency`.

- [ ] **Keep booking and payment states explicit** — Booking states should stay `pending`, `confirmed`, `failed`; payment states should stay `created`, `success`, `failure`, `pending`.

---

## Phase 2 — Introduce Payment Provider Abstraction

- [x] **Move provider logic out of route handlers** — Booking routes now delegate order creation and verification to a backend payment service layer.

- [x] **Add a provider interface** — The backend now has a payment provider abstraction with:
  - `create_order`
  - `verify_payment`
  - optional webhook handling later

- [x] **Implement `MockPaymentProvider`** — Development mock behavior now lives in a dedicated mock provider implementation.

- [x] **Implement provider selection by environment** — Backend settings now support `PAYMENT_PROVIDER=mock|razorpay` and backend-owned mock status defaults.

---

## Phase 3 — Prepare Schema for Real Gateway Usage

- [ ] **Add `provider_payment_id` to `booking_payments`** — Real Razorpay flow needs both an order id and a payment id stored server-side.

- [ ] **Add payment metadata storage** — Add a JSON column or equivalent for provider payload fragments, notes, and reconciliation metadata.

- [ ] **Add `verified_at` timestamp** — Distinguish created payments from cryptographically verified payments.

- [ ] **Review uniqueness constraints** — Ensure `provider_order_id` and future `provider_payment_id` constraints match real gateway semantics.

---

## Phase 4 — Razorpay Test Mode Integration

- [ ] **Create Razorpay order server-side** — Replace mock order generation with a backend call to Razorpay Orders API when `PAYMENT_PROVIDER=razorpay`.

- [ ] **Return public checkout fields only** — The backend should return `key_id`, `order_id`, `booking_reference`, `amount_subunits`, and `currency` to the frontend. Secret values must never leave the backend.

- [ ] **Use Razorpay Checkout in test mode** — The frontend should open checkout using the backend-provided order id and public key.

- [ ] **Post Razorpay response back to backend** — The frontend should send `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, and `booking_reference` back to the verify endpoint.

---

## Phase 5 — Real Verification and Trust Boundary

- [ ] **Implement HMAC-SHA256 signature verification** — Backend must validate `razorpay_signature` using `RAZORPAY_KEY_SECRET` before marking any payment successful.

- [ ] **Reject unverifiable payments** — If signature verification fails, do not confirm booking or mark payment successful.

- [ ] **Ensure booking ownership checks remain server-side** — Payment verification must keep using authenticated backend identity and must never trust client-owned identifiers.

- [ ] **Keep verification idempotent** — Repeated verify calls for the same provider payment/order should not create duplicate state transitions.

---

## Phase 6 — Webhooks and Reconciliation

- [ ] **Add Razorpay webhook endpoint** — Support webhook-driven payment reconciliation for cases where frontend callback flow fails or the browser closes early.

- [ ] **Verify webhook signatures** — Webhooks must be authenticated server-side using Razorpay webhook secrets.

- [ ] **Handle payment events explicitly** — At minimum support payment success, payment failure, and order-paid reconciliation paths.

- [ ] **Store enough provider data for debugging** — Webhook event identifiers and raw gateway references should be traceable for operational debugging.

---

## Phase 7 — Production Hardening

- [ ] **Remove mock behavior from production builds** — No public mock selector, no production `mock_status`, and no user-facing test-only controls.

- [ ] **Add structured logs around payment lifecycle** — Log booking reference, provider order id, provider payment id, verification outcome, and failure reason.

- [ ] **Add retry and reconciliation strategy** — Be able to recover if checkout callback succeeds but frontend verify request fails.

- [ ] **Add alerting for payment failures** — Production payment failures should be observable through logs or monitoring.

- [ ] **Document key rotation and environment setup** — Capture required env vars such as `PAYMENT_PROVIDER`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and webhook secret.

---

## Frontend Rules

- [ ] **Keep frontend orchestration-only** — `frontend/components/public/data/paymentsApi.ts` and `frontend/components/public/expertdetails/sections/booking-hooks/usePaymentFlow.ts` should orchestrate the flow, not decide trust or success.

- [ ] **Do not expose secrets in frontend env** — Only publish Razorpay public key id; secret and webhook credentials stay backend-only.

- [ ] **Do not encode provider business rules in UI** — The frontend should render backend decisions instead of implementing provider-specific trust logic.

---

## Backend Rules

- [ ] **Backend is source of truth for payment state** — Booking confirmation must happen only after backend verification.

- [ ] **Do not trust browser-reported success alone** — Browser callbacks are helpful but not authoritative without backend verification.

- [ ] **Persist provider references explicitly** — Booking, order, payment, and webhook identifiers should remain queryable for support and reconciliation.

---

## Recommended Implementation Order

1. Remove client-visible mock controls from UI.
2. Introduce backend payment provider abstraction.
3. Prepare `booking_payments` schema for real gateway identifiers.
4. Implement Razorpay test-mode order creation.
5. Implement real signature verification.
6. Add webhooks.
7. Remove temporary mock verification path.
8. Move production environment to Razorpay.
