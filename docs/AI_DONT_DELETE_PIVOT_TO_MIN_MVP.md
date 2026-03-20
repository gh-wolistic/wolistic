# Pivot Plan: Minimal MVP (Productionizable)

## Objective
Pivot from AI-led holistic positioning to a lean listing-led business that can be launched safely and improved rapidly.

MVP positioning for now:
1. We are a listing and service coordination platform.
2. Users discover experts, book sessions, pay, and track progress.
3. Professionals manage incoming work, follow-ups, and client communication.

## Blunt Feasibility Assessment
A complete product with all requested scope in one calendar week is not realistic unless there is a larger team and strict cuts.

Requested scope:
1. Listing platform
2. User dashboard with KPI/metrics
3. Professional dashboard with KPI/metrics
4. Follow-ups
5. Chat/inbox
6. Booking
7. Payment
8. Progress tracker
9. Communication rewrite

Realistic delivery estimates:
1. 3 to 5 weeks for a stable production MVP.
2. 1 week for a productionizable alpha only if scope is aggressively reduced.

## Scope Decision Matrix

### Must-Have (Week 1 Alpha)
1. Listing pages for experts and services.
2. Booking flow (simple schedule + confirmation).
3. Payment flow (single provider, success/failure handling, basic verification).
4. User dashboard:
   1. bookings summary
   2. payments summary
   3. progress tracker (basic milestone/status)
5. Professional dashboard:
   1. new booking requests
   2. active clients
   3. follow-up queue (status based)
6. Inbox MVP:
   1. thread-based messages
   2. no advanced realtime indicators required
7. Communication rewrite on key pages.

### Cut For Now (Do Not Build In Week 1)
1. AI recommendations and matching logic.
2. Complex analytics pipeline and custom KPI builder.
3. Rich chat features (typing indicators, attachments, read receipts, push matrix).
4. Deep workflow automation and SLA engines.
5. Dynamic pricing.
6. Complex role-based reporting dashboards.

## Realistic Effort Estimate (Person-Days)
1. Listing and browse hardening: 3 to 5
2. Booking flow hardening: 4 to 6
3. Payment hardening (idempotency + webhook + retries): 4 to 6
4. User dashboard basics: 3 to 5
5. Professional dashboard basics: 4 to 6
6. Follow-up queue: 2 to 4
7. Inbox MVP threads: 5 to 8
8. Progress tracker basics: 3 to 5
9. Communication rewrite: 1 to 2
10. QA + release hardening: 4 to 6

Total estimate: 33 to 53 person-days.

## Team Requirement For 1-Week Push
To make a one-week alpha feasible:
1. 2 frontend engineers
2. 2 backend engineers
3. 1 QA engineer
4. 1 product/designer (at least part-time)
5. 1 tech lead making daily scope cuts

Without this team size, one-week delivery is high risk.

## One-Week Scope Freeze (Recommended)

### Day 1
1. Freeze requirements and remove AI language from core user flow.
2. Finalize data contracts for listing, booking, payment, dashboard cards.
3. Lock copy guidelines for all funnel pages.

### Day 2
1. Complete listing and profile browse path.
2. Complete booking flow to payment handoff.
3. Build skeleton dashboards (user and professional).

### Day 3
1. Integrate payment order + verify + webhook checks.
2. Add progress tracker baseline fields.
3. Add follow-up queue baseline fields.

### Day 4
1. Add inbox threads (simple create/list/reply).
2. Add dashboard KPI cards with baseline metrics.
3. Add failure states and guardrails.

### Day 5
1. QA pass on complete journey.
2. Fix P0 defects only.
3. Staging verification and release readiness checklist.

## Communication Rewrite (Required)
Replace wellness-plan AI-heavy language with practical service language.

### New Message Pillars
1. Discover verified experts.
2. Book and pay easily.
3. Track your progress in one place.
4. Stay connected with your professional.

### Avoid For MVP
1. "AI-powered personalized plan"
2. "Automated recommendation engine"
3. "Expert-backed AI protocol"

### Use Instead
1. "Recommended professionals"
2. "Ready to work with you"
3. "Track bookings, payments, and progress"

## MVP KPI Definitions (Simple)

### User Dashboard KPIs
1. Total bookings
2. Upcoming sessions
3. Completed sessions
4. Amount paid
5. Current progress status

### Professional Dashboard KPIs
1. New requests
2. Active clients
3. Follow-ups due today
4. Sessions this week
5. Revenue snapshot (optional if available)

## Minimum Data Model Additions
1. message_threads
2. message_entries
3. follow_up_tasks
4. progress_logs
5. dashboard_metric_snapshots (optional, can compute live initially)

## MVP API Surface (Lean)
1. GET /listings
2. GET /listings/{id}
3. POST /bookings
4. GET /bookings/me
5. POST /payments/order
6. POST /payments/verify
7. GET /dashboard/user/summary
8. GET /dashboard/professional/summary
9. GET /follow-ups/me
10. POST /follow-ups/{id}/status
11. GET /inbox/threads
12. POST /inbox/threads
13. POST /inbox/threads/{id}/messages

## Productionization Guardrails (Non-Negotiable)
1. Payment idempotency and webhook signature verification.
2. Auth and authorization checks for all dashboard/inbox APIs.
3. Redirect validation for all next/return routes.
4. Basic observability on booking/payment failures.
5. E2E happy-path test for listing -> booking -> payment -> dashboard visibility.

## Definition of Done For Pivot MVP
1. User can discover a listing, book, pay, and see status in dashboard.
2. Professional can see incoming work, follow-up queue, and active clients.
3. User and professional can exchange messages in inbox threads.
4. Progress tracker updates are visible to user.
5. Core communication across app reflects listing-first value proposition.

## Risk Register
1. Risk: Scope creep back to AI-heavy design.
Mitigation: Weekly scope freeze and explicit "not now" list.

2. Risk: Chat complexity expands unexpectedly.
Mitigation: Threaded inbox only in MVP, postpone realtime enhancements.

3. Risk: Payment edge cases delay release.
Mitigation: Prioritize payment hardening before dashboard polish.

4. Risk: Dashboard KPI over-engineering.
Mitigation: Start with 5 fixed KPIs each side.

## Recommendation
Proceed with this pivot if the primary business goal is to launch fast, validate demand, and create a reliable transaction loop.

Do not add AI back into MVP scope until:
1. core listing-booking-payment-dashboard loop is stable,
2. operational metrics are healthy,
3. real usage data exists for smarter matching later.
