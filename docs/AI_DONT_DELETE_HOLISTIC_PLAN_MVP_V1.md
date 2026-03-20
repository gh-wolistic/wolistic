# Holistic Plan MVP V1

## Purpose
This document defines the MVP V1 operating model for the holistic journey and the communication changes required across user and expert dashboards.

## MVP V1 Positioning
Do not position this as "AI-generated holistic plan" in V1.

Positioning for V1:
1. User submits query and quick intake.
2. Experts confirm individually in real time that they can work with the user.
3. Recommendation engine forms valid teams from confirmed experts.
4. Only top 2 ranked teams are shown to the user.
5. User selects one team and pays.
6. Selected paid holistic plan appears in user dashboard.
7. Experts see incoming requests in real time and active plans in dashboard.

Core copy direction:
1. Replace "recommended plan" with "recommended team ready to work with you".
2. Replace "expert-backed plan" with "expert team availability + fit".
3. Keep trust framing: "confirmed experts", "ready now", "best fit for your query".

## Hard Rules For MVP V1
1. Price is fixed at INR 5000.
2. Team is not manually formed by experts.
3. Experts confirm individually; engine composes team combinations.
4. Every team must include one mind expert, one body expert, one diet expert.
5. Show maximum 2 teams to user.
6. If fewer than 2 teams are available, show available teams and fallback wait/ETA.

## Final Success Criteria
1. User can see selected and paid holistic plan in client dashboard.
2. Experts can see real-time incoming requests in their dashboards.
3. Experts can see active plans they are currently part of.
4. User journey is end-to-end functional:
landing -> query -> expert review -> top 2 ready teams -> pay -> dashboard.

## Journey Definition (MVP V1)

### User Journey
1. Landing page query input.
2. Results page CTA to expert review.
3. Expert review intake capture.
4. Team-ready page displays top 2 teams.
5. User selects team and proceeds to payment.
6. Payment success redirects to dashboard with active plan card.

### Expert Journey
1. Real-time request appears in expert dashboard queue.
2. Expert confirms availability for user query.
3. Engine builds and ranks valid team combinations.
4. If chosen by user and paid, plan appears under Active Plans.

## Communication Audit: Files That Need Copy Changes

### Priority P0 (Must change for MVP messaging consistency)

1. [frontend/components/public/wolistic/HeroCtaBanner.tsx](frontend/components/public/wolistic/HeroCtaBanner.tsx)
Current:
- "Yes, get an expert review"
- "design a personalized plan just for you"
Suggested:
- "Yes, find experts ready to work with me"
- "Get matched to confirmed experts ready for your query"

2. [frontend/app/(public)/expert-review/page.tsx](frontend/app/(public)/expert-review/page.tsx)
Current:
- "Let's create your expert-backed plan."
- "Experts can start planning your personalized plan immediately"
Suggested:
- "Let's find experts ready to work with your query."
- "Confirmed experts will respond and we'll show your best 2 teams"

3. [frontend/app/(public)/holistic-plan/page.tsx](frontend/app/(public)/holistic-plan/page.tsx)
Current:
- "Expert-backed holistic plans for you"
- "Review and choose a plan below"
- "Proceed with plan"
Suggested:
- "Top 2 recommended teams ready to work with you"
- "Review and choose a team below"
- "Proceed with this team"

4. [frontend/app/(public)/holistic-plan/[planId]/page.tsx](frontend/app/(public)/holistic-plan/[planId]/page.tsx)
Current:
- "Holistic Plan"
- "Back to plan suggestions"
- "Proceed with plan"
Suggested:
- "Recommended Team"
- "Back to team options"
- "Proceed with this team"

### Priority P1 (Dashboard communication for final success criteria)

5. [frontend/components/dashboard/v1/RoleDashboardPage.tsx](frontend/components/dashboard/v1/RoleDashboardPage.tsx)
Current:
- Generic role summary only.
Required MVP additions:
- Incoming Requests (real-time)
- Active Holistic Plans
- Request status filters (new, confirmed, active)

6. [frontend/app/(dashboard)/v1/client/page.tsx](frontend/app/(dashboard)/v1/client/page.tsx)
Current summary:
- "Track bookings, follow your wellness plans..."
Suggested summary:
- "Track your selected team, active holistic plan, and next steps."

7. [frontend/app/(dashboard)/v1/partner/body-expert/page.tsx](frontend/app/(dashboard)/v1/partner/body-expert/page.tsx)
8. [frontend/app/(dashboard)/v1/partner/diet-expert/page.tsx](frontend/app/(dashboard)/v1/partner/diet-expert/page.tsx)
9. [frontend/app/(dashboard)/v1/partner/mind-expert/page.tsx](frontend/app/(dashboard)/v1/partner/mind-expert/page.tsx)
Required messaging update for all expert dashboards:
- "See real-time requests"
- "Confirm availability"
- "View active holistic plans"

## Product and API Model For MVP V1

### User-facing objects
1. Team Candidate
- team_id
- experts: mind, body, diet
- confidence_score
- readiness_status
- response_eta
- fixed_price_inr = 5000

2. Active Holistic Plan
- plan_id
- team_id
- payment_status
- start_date
- next_step

### Expert-facing objects
1. Incoming Request
- request_id
- user_query
- role_required
- status: new, confirmed, expired
- expires_at

2. Active Assignment
- plan_id
- user_id
- role
- state: active, paused, completed

### Suggested MVP API shape
1. POST /api/v1/holistic-plan/intake
2. POST /api/v1/holistic-plan/expert-requests/{request_id}/confirm
3. GET /api/v1/holistic-plan/ready-teams?intake_id=...
4. GET /api/v1/holistic-plan/ready-teams/{team_id}
5. POST /api/v1/holistic-plan/ready-teams/{team_id}/checkout/order
6. POST /api/v1/holistic-plan/checkout/verify
7. GET /api/v1/holistic-plan/my/active
8. GET /api/v1/holistic-plan/expert/incoming-requests
9. GET /api/v1/holistic-plan/expert/active-plans

## Dashboard Requirements For Final Success

### Client dashboard must show
1. Selected Team (names and roles)
2. Payment status
3. Active Holistic Plan
4. Next action and timeline

### Expert dashboard must show
1. Real-time incoming requests queue
2. One-click confirm action
3. Active plans list
4. Pending workload/availability state

## Non-goals For MVP V1
1. Full expert team collaboration tooling in-app.
2. Complex plan versioning UX.
3. Advanced AI-generated narrative plans.
4. Dynamic pricing.

## Daily MVP V1 Checklist
- [ ] Update journey messaging in P0 files.
- [ ] Implement individual expert confirmation flow.
- [ ] Implement team composition and top-2 ranking response.
- [ ] Update CTA labels from plan-focused to team-focused.
- [ ] Add expert dashboard cards for real-time requests and active plans.
- [ ] Add client dashboard active selected paid plan card.
- [ ] Ensure fixed INR 5000 is enforced server-side and displayed from API.
- [ ] Validate full journey in staging from query to paid plan visibility.
