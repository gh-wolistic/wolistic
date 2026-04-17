# Stage 9: Testing & Validation Guide

## Overview

Comprehensive testing strategy for the Session Booking System (Stages 1-8). This guide covers automated testing, manual QA checklist, and production readiness criteria.

**Testing Philosophy:** Test at all four tiers explicitly. Challenge every happy-path assumption. Verify API enforcement, not just UI gating.

---

## Test Suite Overview

### Backend Tests (pytest)

| Test File | Coverage | Test Count | Focus |
|-----------|----------|------------|-------|
| `test_session_booking_comprehensive.py` | Unit + Edge Cases | 25+ | Tier enforcement, enrollment flow, capacity checks, schema validation, concurrent operations |
| `test_session_booking_integration.py` | Integration + E2E | 10+ | Complete user journeys, refund automation, tier upgrades, publish workflow |

**Total Backend Tests:** ~35+ comprehensive tests

### Frontend Tests (Vitest)

| Test File | Coverage | Test Count | Focus |
|-----------|----------|------------|-------|
| `SessionDetailsPage.test.tsx` | Component | 15+ | Loading states, authentication guards, enrollment flow, waitlist, capacity indicators |
| `SessionsBrowsePage.test.tsx` | Component | 20+ | Search filtering, category filtering, date filtering, combined filters, empty states |
| `MyEnrollmentsPage.test.tsx` | Component | 20+ | Authentication guard, status tracking, payment display, refunds, filtering |

**Total Frontend Tests:** ~55+ comprehensive tests

---

## Quick Start: Running Tests

### Backend Tests

```powershell
# Navigate to backend
cd c:\wolistic.com\backend

# Run all session booking tests
pytest tests/test_session_booking_comprehensive.py -v

# Run integration tests
pytest tests/test_session_booking_integration.py -v

# Run all session tests with coverage
pytest tests/test_session_booking*.py --cov=app.api.v1.partners.classes --cov=app.api.v1.partners.sessions --cov=app.api.v1.public.sessions --cov-report=html

# Run specific test class
pytest tests/test_session_booking_comprehensive.py::TestTierEnforcement -v

# Run specific test
pytest tests/test_session_booking_comprehensive.py::TestTierEnforcement::test_free_tier_class_limit -v
```

### Frontend Tests

```powershell
# Navigate to frontend
cd c:\wolistic.com\frontend

# Run all session component tests
npm run test -- components/sessions/__tests__/

# Run specific test file
npm run test -- SessionDetailsPage.test.tsx

# Run with coverage
npm run test -- --coverage components/sessions/

# Watch mode (for development)
npm run test -- --watch components/sessions/__tests__/
```

---

## Test Categories & Coverage

### 1. Tier Enforcement Tests (CRITICAL)

**Coverage:** All four tiers (Free, Pro, Elite, Celeb)

| Tier | Class Limit | Session/Class Limit | Test Status |
|------|-------------|---------------------|-------------|
| Free | 2 | 8 | ✅ `test_free_tier_class_limit`, `test_free_tier_session_limit` |
| Pro | 5 | 20 | ✅ `test_pro_tier_class_limit` |
| Elite | 15 | 60 | ✅ `test_elite_tier_class_limit` |
| Celeb | Unlimited | Unlimited | ✅ `test_celeb_tier_unlimited_classes` |

**What's Tested:**
- Class creation blocked at tier limit
- Session creation blocked at tier limit per class
- Celeb tier truly unlimited
- Tier upgrade unlocks higher limits (integration test)

**Commands:**
```powershell
# Backend tier enforcement tests
cd c:\wolistic.com\backend
pytest tests/test_session_booking_comprehensive.py::TestTierEnforcement -v
pytest tests/test_session_booking_integration.py::TestTierUpgradeFlow -v
```

---

### 2. Enrollment Flow Tests (CRITICAL)

**Coverage:** Enrollment creation, capacity checks, duplicate prevention

**What's Tested:**
- ✅ Enrollment succeeds when capacity available
- ✅ Enrollment fails when session sold out
- ✅ Duplicate enrollment blocked (same user, same session)
- ✅ Enrollment blocked for draft (unpublished) sessions
- ✅ Capacity boundary: exactly N enrollments for capacity N
- ✅ Concurrent enrollment at capacity (race condition)

**Commands:**
```powershell
# Backend enrollment tests
cd c:\wolistic.com\backend
pytest tests/test_session_booking_comprehensive.py::TestEnrollmentFlow -v
pytest tests/test_session_booking_comprehensive.py::TestConcurrentOperations -v
pytest tests/test_session_booking_integration.py::TestCompleteEnrollmentFlow -v

# Frontend enrollment tests
cd c:\wolistic.com\frontend
npm run test -- SessionDetailsPage.test.tsx
```

---

### 3. Publish Workflow Tests (CRITICAL)

**Coverage:** Draft → Published → Locked immutability

**What's Tested:**
- ✅ Session created as draft by default
- ✅ Draft session can be edited
- ✅ Published session is immutable (edit blocked)
- ✅ Publish transition successful
- ✅ Clients cannot enroll in draft sessions

**Commands:**
```powershell
# Backend workflow tests
cd c:\wolistic.com\backend
pytest tests/test_session_booking_comprehensive.py::TestPublishWorkflow -v
pytest tests/test_session_booking_integration.py::TestPublishWorkflowImmutability -v
```

---

### 4. Attendance & Refund Tests (CRITICAL)

**Coverage:** Attendance marking, automatic refunds

**What's Tested:**
- ✅ Mark attendance: `attended` status
- ✅ Mark `session_cancelled` → triggers refund
- ✅ Mark `no_show_client` → NO refund
- ✅ Refund updates `payment_status` to `refunded`
- ✅ Multiple enrollments refunded in bulk
- ✅ Refund amount matches original payment

**Commands:**
```powershell
# Backend refund tests
cd c:\wolistic.com\backend
pytest tests/test_session_booking_comprehensive.py::TestAttendanceAndRefunds -v
pytest tests/test_session_booking_integration.py::TestRefundAutomationFlow -v

# Frontend refund display tests
cd c:\wolistic.com\frontend
npm run test -- MyEnrollmentsPage.test.tsx
```

---

### 5. Waitlist Tests

**Coverage:** Interest registration for sold-out sessions

**What's Tested:**
- ✅ Waitlist registration when session sold out
- ✅ Waitlist blocked when capacity available
- ✅ Authentication required for waitlist
- ✅ UI shows "Join Waitlist" button for sold-out sessions

**Commands:**
```powershell
# Backend waitlist tests
cd c:\wolistic.com\backend
pytest tests/test_session_booking_comprehensive.py::TestWaitlist -v

# Frontend waitlist tests
cd c:\wolistic.com\frontend
npm run test -- SessionDetailsPage.test.tsx
```

---

### 6. Schema Validation Tests

**Coverage:** Required fields, constraints, data types

**What's Tested:**
- ✅ Required fields (title, category, duration, capacity, price)
- ✅ Invalid category enum rejected
- ✅ Capacity > 0 validation
- ✅ Price >= 0 validation
- ✅ Duration > 0 validation
- ✅ Session date cannot be in past (creation)

**Commands:**
```powershell
# Backend schema tests
cd c:\wolistic.com\backend
pytest tests/test_session_booking_comprehensive.py::TestSchemaValidation -v
```

---

### 7. Frontend Component Tests

**Coverage:** React component behavior, user interactions

#### SessionDetailsPage
- ✅ Loading states
- ✅ Error handling
- ✅ Session details display
- ✅ Category color schemes (mind: violet, body: emerald, nutrition: amber, lifestyle: sky)
- ✅ Date/time formatting
- ✅ Capacity indicators (green >2, amber 1-2, red sold out)
- ✅ Authentication guard (redirect to login)
- ✅ Enrollment button behavior
- ✅ Waitlist button for sold-out

#### SessionsBrowsePage
- ✅ Professional vs global browse mode
- ✅ Search filtering (case-insensitive)
- ✅ Category filtering
- ✅ Date filtering (Today, This Week, This Month)
- ✅ Combined filters
- ✅ Empty states
- ✅ "Clear Filters" button
- ✅ Navigation to session details

#### MyEnrollmentsPage
- ✅ Authentication guard
- ✅ Status badges (confirmed, attended, cancelled, no_show, session_cancelled)
- ✅ Payment status display (paid, pending, refunded)
- ✅ Refund notices
- ✅ Time filtering (All, Upcoming, Past)
- ✅ Status filtering
- ✅ Empty state with "Browse Sessions" CTA

**Commands:**
```powershell
cd c:\wolistic.com\frontend

# Run all component tests
npm run test -- components/sessions/__tests__/

# Individual components
npm run test -- SessionDetailsPage.test.tsx
npm run test -- SessionsBrowsePage.test.tsx
npm run test -- MyEnrollmentsPage.test.tsx
```

---

## Test Execution Workflow

### Step 1: Setup Test Environment

```powershell
# Backend: Ensure test database is available
cd c:\wolistic.com\backend
docker-compose up -d db

# Frontend: Install dependencies
cd c:\wolistic.com\frontend
npm install
```

### Step 2: Run Backend Tests

```powershell
cd c:\wolistic.com\backend

# Run all session booking tests
pytest tests/test_session_booking_comprehensive.py tests/test_session_booking_integration.py -v

# With coverage report
pytest tests/test_session_booking*.py --cov=app.api.v1.partners.classes --cov=app.api.v1.partners.sessions --cov=app.api.v1.public.sessions --cov-report=html --cov-report=term

# Open coverage report
start htmlcov/index.html
```

**Expected Results:**
- ✅ 35+ tests pass
- ✅ Coverage > 85% for session-related endpoints
- ✅ Zero failures on tier enforcement tests
- ✅ Zero failures on refund automation tests

### Step 3: Run Frontend Tests

```powershell
cd c:\wolistic.com\frontend

# Run all component tests
npm run test -- components/sessions/__tests__/ --coverage

# View coverage report
start coverage/index.html
```

**Expected Results:**
- ✅ 55+ tests pass
- ✅ Component coverage > 80%
- ✅ Zero failures on authentication guard tests
- ✅ Zero failures on filter logic tests

### Step 4: Run Integration Tests

```powershell
cd c:\wolistic.com\backend

# Run E2E integration tests
pytest tests/test_session_booking_integration.py -v --tb=short
```

**Expected Results:**
- ✅ All E2E flows complete successfully
- ✅ Happy path enrollment completes (create → publish → enroll → attend)
- ✅ Refund automation verified
- ✅ Tier upgrade flow works

---

## Coverage Targets

### Backend Coverage Goals

| Module | Target | Priority |
|--------|--------|----------|
| `app.api.v1.partners.classes` | 90% | CRITICAL |
| `app.api.v1.partners.sessions` | 90% | CRITICAL |
| `app.api.v1.public.sessions` | 85% | CRITICAL |
| `app.services.refund_service` | 85% | HIGH |
| `app.helpers.session_helpers` | 80% | HIGH |

### Frontend Coverage Goals

| Component | Target | Priority |
|-----------|--------|----------|
| SessionDetailsPage | 85% | CRITICAL |
| SessionsBrowsePage | 80% | HIGH |
| MyEnrollmentsPage | 80% | HIGH |
| sessions API client | 75% | HIGH |

---

## Manual QA Checklist

**User will perform manual UI testing. This checklist guides what to test.**

### Professional Flow (Elite Partner)

- [ ] **Create Class**
  - [ ] Fill all required fields
  - [ ] Verify validation (capacity > 0, price >= 0)
  - [ ] Class appears in dashboard

- [ ] **Create Session (Draft)**
  - [ ] Select class from dropdown
  - [ ] Pick future date and time
  - [ ] Session created with "Draft" status

- [ ] **Edit Draft Session**
  - [ ] Change start time
  - [ ] Change session date
  - [ ] Edits save successfully

- [ ] **Publish Session**
  - [ ] Click "Publish" button
  - [ ] Status changes to "Published"
  - [ ] Try to edit → should be blocked with error message

- [ ] **View Enrollments**
  - [ ] See list of enrolled clients
  - [ ] View enrollment details (name, status, payment status)

- [ ] **Mark Attendance**
  - [ ] For past session, mark attendance
  - [ ] Select "Attended" for present clients
  - [ ] Select "No Show" for absent clients
  - [ ] Select "Session Cancelled" → verify refund notice

### Client Flow

- [ ] **Browse Sessions**
  - [ ] View all published sessions
  - [ ] Search by keyword
  - [ ] Filter by category (Mind, Body, Nutrition, Lifestyle)
  - [ ] Filter by date (Today, This Week, This Month)
  - [ ] Clear filters and see all sessions

- [ ] **View Session Details**
  - [ ] Click session card
  - [ ] See full session details
  - [ ] See professional info (clickable link to profile)
  - [ ] See capacity indicator:
    - [ ] Green "X spots left" when >2 spots
    - [ ] Amber "1 spot left" or "2 spots left"
    - [ ] Red "Sold Out" when full

- [ ] **Enroll in Session**
  - [ ] Click "Enroll Now" when not logged in → redirect to login
  - [ ] Log in and return to session
  - [ ] Click "Enroll Now"
  - [ ] Complete payment (Razorpay) — TODO: Not implemented yet
  - [ ] See success message
  - [ ] Redirect to "My Enrollments"

- [ ] **Join Waitlist**
  - [ ] For sold-out session, see "Join Waitlist" button
  - [ ] Click button → see success message
  - [ ] Cannot join waitlist for non-sold-out session

- [ ] **View My Enrollments**
  - [ ] See all enrolled sessions
  - [ ] Filter by time (All, Upcoming, Past)
  - [ ] Filter by status
  - [ ] See payment status (Paid, Pending, Refunded)
  - [ ] For refunded enrollments, see refund notice
  - [ ] Click professional name → navigate to profile

### Edge Cases to Test Manually

- [ ] **Capacity Boundary**
  - [ ] Create session with capacity 2
  - [ ] Enroll 2 clients
  - [ ] Try to enroll 3rd client → see "Sold Out" error

- [ ] **Duplicate Enrollment**
  - [ ] Enroll in session
  - [ ] Try to enroll again → see "Already enrolled" error

- [ ] **Draft Session Enrollment**
  - [ ] Try to access draft session URL directly
  - [ ] Should not show "Enroll" button or show error

- [ ] **Tier Limits (Professional)**
  - [ ] Free tier: Try to create 3rd class → blocked
  - [ ] Free tier: Try to create 9th session in one class → blocked

---

## Known Limitations & TODO Items

### Backend Endpoints (To Be Implemented)

1. **GET /api/v1/sessions/published**
   - Global session discovery endpoint
   - Needed for: `getAllPublishedSessions()` in frontend
   - Priority: HIGH
   - Estimate: 2-3 days

2. **GET /api/v1/enrollments/me**
   - User's enrollment history endpoint
   - Needed for: `getMyEnrollments()` in frontend
   - Priority: HIGH
   - Estimate: 1-2 days

### Payment Integration (Critical for Production)

- **Razorpay Integration**
  - Create payment order endpoint (backend)
  - Payment verification webhook (backend)
  - Frontend payment modal (SessionDetailsPage)
  - Test with Razorpay test mode
  - Priority: CRITICAL
  - Estimate: 1 week

- **Refund API Integration**
  - Connect refund service to Razorpay refund API
  - Update `payment_refunds` table with provider response
  - Add retry logic for failed refunds
  - Priority: HIGH
  - Estimate: 3-5 days

### Frontend Improvements

- **Calendar View** (Nice-to-have)
  - Monthly calendar showing all sessions
  - Click date → filter sessions
  - Estimate: 1 week

- **Session Reviews** (Nice-to-have)
  - Clients can review attended sessions
  - Display reviews on session details
  - Estimate: 1 week

- **Session Favorites** (Nice-to-have)
  - Save sessions for later
  - View saved sessions list
  - Estimate: 3 days

---

## Quality Gates (Go/No-Go Criteria)

### CRITICAL (Blockers for Production)

- [ ] **All backend tests pass** (35+ tests)
- [ ] **All frontend tests pass** (55+ tests)
- [ ] **Backend coverage > 85%** for session endpoints
- [ ] **Frontend coverage > 80%** for session components
- [ ] **Zero tier enforcement bugs** (verified in manual QA)
- [ ] **Zero refund automation bugs** (verified in manual QA)
- [ ] **Payment integration complete** (Razorpay)
- [ ] **Both backend endpoints implemented** (`/sessions/published`, `/enrollments/me`)

### HIGH (Important, but can be fixed post-launch)

- [ ] **Zero enrollment edge case bugs** (duplicate, capacity, draft)
- [ ] **Zero publish workflow bugs** (draft → edit → publish → locked)
- [ ] **Waitlist registration works** (verified in manual QA)
- [ ] **All filters work** (search, category, date, status, time)
- [ ] **Accessibility audit passed** (WCAG 2.1 AA)
- [ ] **Performance test passed** (100 concurrent users)

### MEDIUM (Nice-to-have improvements)

- [ ] Calendar view implemented
- [ ] Session reviews implemented
- [ ] Session favorites implemented
- [ ] Email notifications for enrollments
- [ ] SMS reminders for upcoming sessions

---

## Test Failure Triage

### If Backend Tests Fail

1. **Check database state:**
   ```powershell
   cd c:\wolistic.com\backend
   docker-compose logs db
   ```

2. **Run single failing test with verbose output:**
   ```powershell
   pytest tests/test_session_booking_comprehensive.py::TestTierEnforcement::test_free_tier_class_limit -vv --tb=long
   ```

3. **Check for migration issues:**
   ```powershell
   docker-compose exec backend alembic current
   docker-compose exec backend alembic upgrade head
   ```

### If Frontend Tests Fail

1. **Check mock implementations:**
   - Ensure `vi.mock()` calls match import paths
   - Verify mock return values match expected types

2. **Run single test with debug output:**
   ```powershell
   npm run test -- SessionDetailsPage.test.tsx --reporter=verbose
   ```

3. **Check for missing dependencies:**
   ```powershell
   npm install
   ```

---

## Test Metrics & Reporting

### Current Test Coverage

**Backend:**
- Files: 2 test files
- Tests: ~35 comprehensive tests
- Coverage: TBD (run coverage report)

**Frontend:**
- Files: 3 test files
- Tests: ~55 component tests
- Coverage: TBD (run coverage report)

**Integration:**
- E2E Flows: 10+ complete user journeys
- Critical Paths: All tier enforcement, refund automation, enrollment flow

### Running Coverage Reports

```powershell
# Backend coverage
cd c:\wolistic.com\backend
pytest tests/test_session_booking*.py --cov=app.api.v1.partners.classes --cov=app.api.v1.partners.sessions --cov=app.api.v1.public.sessions --cov-report=html
start htmlcov/index.html

# Frontend coverage
cd c:\wolistic.com\frontend
npm run test -- --coverage components/sessions/
start coverage/index.html
```

---

## Next Steps

1. **Run all automated tests** (backend + frontend)
2. **Review coverage reports** → ensure targets met
3. **Perform manual QA** using checklist above
4. **Fix any failing tests** before proceeding
5. **Implement missing backend endpoints** (`/sessions/published`, `/enrollments/me`)
6. **Integrate Razorpay payment** (CRITICAL blocker)
7. **Final E2E test** with payment flow
8. **Production deployment** (follow `PRODUCTION_READINESS.md`)

---

## Success Criteria

✅ **All automated tests passing (90+ tests total)**  
✅ **Coverage targets met (>80% overall)**  
✅ **Manual QA checklist complete (zero critical bugs)**  
✅ **Payment integration functional**  
✅ **Missing backend endpoints implemented**  
✅ **Zero tier enforcement bypass vulnerabilities**  
✅ **Refund automation verified end-to-end**  

**Estimated Timeline:** 2-3 weeks for full testing cycle + fixes + missing features

---

## Commands Quick Reference

```powershell
# Backend Tests
cd c:\wolistic.com\backend
pytest tests/test_session_booking_comprehensive.py -v
pytest tests/test_session_booking_integration.py -v
pytest tests/test_session_booking*.py --cov --cov-report=html

# Frontend Tests
cd c:\wolistic.com\frontend
npm run test -- components/sessions/__tests__/
npm run test -- --coverage components/sessions/

# Run Specific Tests
pytest tests/test_session_booking_comprehensive.py::TestTierEnforcement -v
npm run test -- SessionDetailsPage.test.tsx

# Coverage Reports
start htmlcov/index.html  # Backend
start coverage/index.html  # Frontend
```

---

**END OF TESTING GUIDE**
