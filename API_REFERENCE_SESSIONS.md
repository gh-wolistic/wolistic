# Session Booking API Reference

**Complete API Documentation for Session/Class Management System**  
**Base URL:** `http://localhost:8000/api/v1`

---

## 🔐 Authentication

All endpoints marked with 🔒 require JWT Bearer token:
```
Authorization: Bearer <jwt_token>
```

---

## 👨‍⚕️ Partner (Expert) Endpoints

**Prefix:** `/partners`  
**Tag:** `classes`  
**Total:** 18 endpoints

### Class Management (6 endpoints)

#### 1. Create Class
```http
POST /partners/classes
🔒 Requires: Partner authentication
```

**Request:**
```json
{
  "title": "Morning Yoga Flow",
  "description": "Gentle morning flow for all levels",
  "category": "mind",
  "display_term": "session",
  "duration_minutes": 60,
  "capacity": 10,
  "price": 299.00,
  "work_location_id": 1,
  "tags": ["yoga", "beginner"]
}
```

**Tier Enforcement:**
- Free: 2 active classes max
- Pro: 5 active classes max
- Elite: 15 active classes max
- Celeb: Unlimited

**Response:** `201 Created`

---

#### 2. List My Classes
```http
GET /partners/classes
🔒 Requires: Partner authentication
```

**Query Params:**
- `category` (optional): Filter by category
- `status` (optional): Filter by status (active/cancelled)

**Response:**
```json
{
  "classes": [
    {
      "id": 45,
      "title": "Morning Yoga Flow",
      "category": "mind",
      "total_sessions": 12,
      "published_sessions": 8,
      "total_enrollments": 67,
      "expires_on": "2025-05-15",
      "status": "active"
    }
  ]
}
```

---

#### 3. Get Class Details
```http
GET /partners/classes/{class_id}
🔒 Requires: Partner authentication
```

**Response:** Full class details + sessions + enrollments

---

#### 4. Update Class
```http
PUT /partners/classes/{class_id}
🔒 Requires: Partner authentication
```

**Note:** Cannot edit if class has published sessions (immutability protection)

---

#### 5. Delete Class
```http
DELETE /partners/classes/{class_id}
🔒 Requires: Partner authentication
```

**Validation:** Cannot delete if active sessions exist

---

#### 6. Renew Class Expiry
```http
POST /partners/classes/{class_id}/renew
🔒 Requires: Partner authentication
```

**Request:**
```json
{
  "new_expiry_date": "2025-08-15",
  "update_details": false  // Optional: also update description/price
}
```

**Use Case:** Extend class lifetime beyond 3-month default

---

### Session Management (5 endpoints)

#### 7. Create Session
```http
POST /partners/sessions
🔒 Requires: Partner authentication
```

**Request:**
```json
{
  "group_class_id": 45,
  "session_date": "2025-02-15",
  "start_time": "09:00:00",
  "notes": "Bring your own mat"
}
```

**Tier Enforcement:**
- Free: 8 sessions per month max
- Pro: 20 sessions per month max
- Elite: 60 sessions per month max
- Celeb: Unlimited

**Validation:**
- Session date must be within class expiry
- Cannot create in past
- Default status: `draft` (not visible to clients)

**Response:** `201 Created`

---

#### 8. Publish Session
```http
POST /partners/sessions/{session_id}/publish
🔒 Requires: Partner authentication
```

**Effect:**
- Changes status: `draft` → `published`
- Makes session visible to clients
- Immutability: Cannot edit after publishing
- Records `published_at` timestamp

**Response:**
```json
{
  "session_id": 123,
  "status": "published",
  "message": "Session published successfully",
  "immutable_warning": "This session can no longer be edited"
}
```

---

#### 9. Cancel Session
```http
POST /partners/sessions/{session_id}/cancel
🔒 Requires: Partner authentication
```

**Request:**
```json
{
  "cancellation_reason": "Emergency - rescheduling next week"
}
```

**Automatic Actions:**
1. Changes status: `published` → `cancelled`
2. **Auto-refunds all confirmed enrollments** (via `refund_service.py`)
3. Updates expert reliability score (late cancellation penalty if <24h notice)
4. Records `cancelled_at` timestamp

**Response:**
```json
{
  "session_id": 123,
  "status": "cancelled",
  "enrollments_cancelled": 7,
  "successful_refunds": 7,
  "failed_refunds": 0,
  "total_refunded": 2093.00,
  "refund_status": "processing",
  "message": "Session cancelled. 7 clients refunded ₹2093.00 total."
}
```

**Reliability Score Impact:**
- >24h notice: -5 points
- <24h notice: -15 points
- Max score: 100, never goes below 0

---

#### 10. Mark Attendance
```http
POST /partners/sessions/{session_id}/mark-attendance
🔒 Requires: Partner authentication
```

**Request:**
```json
{
  "attendance": [
    {"enrollment_id": 101, "status": "attended"},
    {"enrollment_id": 102, "status": "no_show_client"},
    {"enrollment_id": 103, "status": "attended"}
  ]
}
```

**Attendance Statuses:**
- `attended` - Client showed up (no refund)
- `no_show_client` - Client didn't show (no refund)
- `session_cancelled` - Expert cancelled (auto-refund)

**Special Cases:**
- If expert marks `session_cancelled` → auto-refunds all
- If expert never marks attendance → auto-refund after 48h (cron job)

**Response:**
```json
{
  "session_id": 123,
  "updated_count": 3,
  "refunds_processed": 0
}
```

---

#### 11. List My Sessions
```http
GET /partners/sessions
🔒 Requires: Partner authentication
```

**Query Params:**
- `class_id` (optional): Filter by class
- `status` (optional): draft/published/cancelled
- `from_date` (optional): Start date filter
- `to_date` (optional): End date filter

**Response:** List of sessions with enrollment counts

---

### Tier Limits (1 endpoint)

#### 12. Get My Tier Limits
```http
GET /partners/tier-limits
🔒 Requires: Partner authentication
```

**Response:**
```json
{
  "tier_name": "pro",
  "limits": {
    "max_active_classes": 5,
    "max_sessions_per_month": 20
  },
  "current_usage": {
    "active_classes": 3,
    "sessions_this_month": 12
  },
  "available": {
    "classes": 2,
    "sessions": 8
  }
}
```

**Use Case:** Display usage bars in dashboard, upgrade prompts

---

### Additional Partner Endpoints (6)

#### 13-18. Other Partner Features
- **GET /partners/enrollments** - List all enrollments across classes
- **GET /partners/analytics** - Revenue, attendance stats
- **POST /partners/work-locations** - Create venue
- **GET /partners/work-locations** - List venues
- **PUT /partners/work-locations/{id}** - Update venue
- **DELETE /partners/work-locations/{id}** - Delete venue

---

## 🌐 Public (Client) Endpoints

**Prefix:** `/sessions`, `/professionals`  
**Tag:** `sessions-public`  
**Total:** 4 endpoints

### Session Discovery

#### 19. Get Session Details
```http
GET /sessions/{session_id}
✅ No authentication required (public SEO endpoint)
```

**Response:**
```json
{
  "id": 123,
  "class_id": 45,
  "title": "Morning Yoga Flow",
  "category": "mind",
  "display_term": "session",
  "session_date": "2025-02-15",
  "start_time": "09:00:00",
  "duration_minutes": 60,
  "capacity": 10,
  "enrolled_count": 7,
  "is_sold_out": false,
  "price": 299.00,
  "description": "Gentle morning flow for all levels",
  "work_location": {
    "name": "Downtown Studio",
    "address": "123 Main St, Mumbai",
    "location_type": "offline"
  }
}
```

**Filters:**
- Only `published` sessions returned
- Returns 404 for draft/cancelled sessions

---

#### 20. List Professional's Sessions
```http
GET /professionals/{username}/sessions
✅ No authentication required (public)
```

**Example:** `GET /professionals/dr-anjali-sharma/sessions`

**Response:**
```json
{
  "sessions": [
    {
      "id": 123,
      "title": "Morning Yoga Flow",
      "session_date": "2025-02-15",
      "start_time": "09:00:00",
      "capacity": 10,
      "enrolled_count": 7,
      "is_sold_out": false,
      "price": 299.00
    },
    {
      "id": 124,
      "title": "Evening Meditation",
      "session_date": "2025-02-16",
      "start_time": "18:00:00",
      "capacity": 15,
      "enrolled_count": 15,
      "is_sold_out": true,
      "price": 199.00
    }
  ]
}
```

**Filters:**
- Only verified professionals
- Only published sessions
- Only future dates (`>= today`)
- Ordered by date + time

---

### Client Enrollment

#### 21. Enroll in Session
```http
POST /sessions/{session_id}/enroll
🔒 Requires: Client authentication
```

**Request:**
```json
{
  "payment_order_id": "order_abc123xyz456"
}
```

**Validation:**
1. User must be authenticated
2. Session must be published
3. Session must not be sold out
4. User cannot enroll twice in same session
5. Payment must be valid (TODO: Razorpay integration)

**Response:**
```json
{
  "enrollment_id": 789,
  "status": "confirmed",
  "session_details": {
    "id": 123,
    "title": "Morning Yoga Flow",
    "session_date": "2025-02-15",
    "start_time": "09:00:00",
    "duration_minutes": 60
  },
  "payment_confirmation": {
    "amount_paid": 299.00,
    "payment_status": "paid"
  },
  "message": "Successfully enrolled in Morning Yoga Flow!"
}
```

**Auto-Locking:** Session becomes immutable on first enrollment

---

#### 22. Register Interest (Waitlist)
```http
POST /sessions/{session_id}/interest
🔒 Requires: Client authentication
```

**Use Case:** Session is sold out, client wants notification if spots open

**Response:**
```json
{
  "interested": true,
  "session_id": 123,
  "message": "We'll notify you if spots open up!"
}
```

**Future Feature:** Email notification when cancellations free up capacity

---

## 🔄 Background Jobs (Cron)

### Auto-Refund No-Show Sessions
**Script:** `backend/app/scripts/auto_refund_no_show_sessions.py`  
**Schedule:** Daily at 2 AM (`0 2 * * *`)  
**Logic:**
1. Find published sessions >48h old
2. Check if expert marked attendance
3. If not marked → auto-refund all confirmed enrollments
4. Update expert reliability score (-10 points)

**Crontab:**
```bash
0 2 * * * cd /app && python -m app.scripts.auto_refund_no_show_sessions
```

---

### Retry Failed Refunds
**Script:** `backend/app/scripts/retry_failed_refunds.py`  
**Schedule:** Daily at 3 AM (`0 3 * * *`)  
**Logic:**
1. Find enrollments with `refund_amount` set but `refund_provider_id` NULL (failed refunds)
2. Retry payment provider refund (up to 3 attempts)
3. Log still-failed refunds for manual intervention

**Crontab:**
```bash
0 3 * * * cd /app && python -m app.scripts.retry_failed_refunds
```

---

## 📊 Tier Comparison

| Feature | Free | Pro | Elite | Celeb |
|---------|------|-----|-------|-------|
| Active Classes | 2 | 5 | 15 | Unlimited |
| Sessions/Month | 8 | 20 | 60 | Unlimited |
| Refund Automation | ✅ | ✅ | ✅ | ✅ |
| Reliability Tracking | ✅ | ✅ | ✅ | ✅ |
| Auto-Renewal | ❌ | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ | ✅ |

---

## 🧩 Integration Checklist

### ✅ Completed
- [x] Database schema with 3 new tables, 11+ new columns
- [x] SQLAlchemy models (6 total: WorkLocation, GroupClass, ClassSession, ClassEnrollment, SessionInterest, ExpertSessionReliability, TierLimit)
- [x] Pydantic schemas (15+ schemas for requests/responses)
- [x] Tier enforcement logic (check limits on creation)
- [x] Refund service with Razorpay integration structure
- [x] Auto-refund cron jobs (48h grace period)
- [x] Retry failed refunds logic
- [x] Reliability score tracking
- [x] 18 partner endpoints
- [x] 4 public endpoints
- [x] Session immutability (locked on publish/enrollment)
- [x] Expiry validation (3-month default)

### ⏳ TODO (Production)
- [ ] Razorpay payment verification in enrollment endpoint
- [ ] Razorpay refund API integration (replace mock)
- [ ] Email notifications (enrollment confirmation, refund status, waitlist alerts)
- [ ] Frontend dashboard updates (rename Classes → Sessions, tier limit UI)
- [ ] Frontend public components (session discovery, booking flow)
- [ ] End-to-end testing (enrollment → cancellation → refund flow)
- [ ] Cron job deployment (add to server crontab)

---

## 🛠️ Quick Start Testing

### 1. Check API Health
```bash
curl http://localhost:8000/api/v1/health
# Response: {"status":"ok"}
```

### 2. Test Tier Limits (Authenticated)
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/partners/tier-limits
```

### 3. List Public Sessions (No Auth)
```bash
curl http://localhost:8000/api/v1/professionals/dr-anjali-sharma/sessions
```

### 4. Verify Background Services
```bash
# Test auto-refund script
docker-compose exec backend python -m app.scripts.auto_refund_no_show_sessions

# Test retry failed refunds
docker-compose exec backend python -m app.scripts.retry_failed_refunds
```

---

**Last Updated:** January 2025  
**Total Endpoints:** 22 (18 partner + 4 public)  
**Status:** Backend complete, frontend pending
