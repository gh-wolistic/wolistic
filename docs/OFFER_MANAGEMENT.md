# Offer Management System Documentation

## Overview

Centralized offer management system for tier upgrades, discounts, and promotional campaigns. Supports time-limited offers with automatic downgrade, usage tracking, and audit trails.

**Key Features:**
- Polymorphic offer catalog (tier upgrades, service discounts)
- Ledger-based assignment tracking (append-only audit trail)
- Automatic tier downgrade with grace period notifications
- Usage limits and redemption tracking
- Admin UI for offer lifecycle management

---

## Architecture

### Database Schema

**offers** (catalog table)
- `id` (bigint, PK): Unique offer identifier
- `code` (varchar(50), unique): User-facing offer code (e.g., "LAUNCH2026")
- `name` (varchar(200)): Display name
- `description` (text): Marketing description
- `offer_type` (varchar(32)): "tier_upgrade" | "tier_discount" | "service_discount"
- `domain` (varchar(32)): "subscription" | "service" | "booking"
- `target_tier` (varchar(32)): Target membership tier (for tier_upgrade)
- `duration_months` (int): Tier duration (null = permanent)
- `auto_downgrade_after_months` (int): Auto-downgrade trigger (null = no downgrade)
- `downgrade_to_tier` (varchar(32)): Downgrade target (e.g., "free")
- `discount_type` (varchar(32)): Future use for service discounts
- `discount_value` (numeric(10,2)): Future use for service discounts
- `max_redemptions` (int): Global redemption limit (null = unlimited)
- `max_redemptions_per_professional` (int): Per-user limit (default: 1)
- `valid_from` (timestamp): Offer start date
- `valid_until` (timestamp): Offer expiry date (null = no expiry)
- `created_by` (uuid, FK): Admin user who created offer
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp
- `is_active` (boolean): Active status flag

**Indexes:**
- `ix_offers_code` (unique)
- `ix_offers_offer_type`
- `ix_offers_domain`
- `ix_offers_valid_from`
- `ix_offers_valid_until`

---

**offer_assignments** (ledger table - append-only)
- `id` (bigint, PK): Assignment record ID
- `offer_id` (bigint, FK→offers): Offer catalog reference
- `professional_id` (uuid, FK→professionals): Professional receiving offer
- `assigned_by` (uuid, FK→users): Admin who assigned offer
- `status` (varchar(32)): "pending" | "active" | "redeemed" | "expired" | "revoked"
- `assigned_at` (timestamp): Assignment timestamp
- `activated_at` (timestamp): When offer became active
- `expires_at` (timestamp): When offer expires (calculated from duration_months)
- `redeemed_at` (timestamp): When professional used the offer
- `revoked_at` (timestamp): When admin cancelled offer
- `revoked_by` (uuid, FK→users): Admin who revoked offer
- `revoke_reason` (text): Reason for revocation
- `notes` (text): Admin notes

**Status Workflow:**
1. **pending** → Created but not yet applied to professional's account
2. **active** → Applied to professional's subscription, tier upgraded
3. **redeemed** → Professional completed service booking/purchase using discount
4. **expired** → Offer validity period ended without redemption
5. **revoked** → Admin manually cancelled offer

**Indexes:**
- `ix_offer_assignments_offer_id`
- `ix_offer_assignments_professional_id`
- `ix_offer_assignments_status`
- `ix_offer_assignments_assigned_by`
- `ix_offer_assignments_professional_status` (composite: professional_id, status)

---

**professional_subscriptions extensions**
- `offer_assignment_id` (bigint, FK→offer_assignments): Link to offer that created subscription
- `subscription_type` (varchar(32)): "self_paid" | "admin_upgrade" | "offer_redemption" | "partner_sponsored"
- `auto_downgrade_at` (timestamp): When to trigger auto-downgrade
- `auto_downgrade_to_tier` (varchar(32)): Target tier for downgrade

**Indexes:**
- `ix_professional_subscriptions_offer_assignment_id`
- `ix_professional_subscriptions_subscription_type`
- `ix_professional_subscriptions_auto_downgrade_at`

---

## API Reference

### Admin Endpoints

All endpoints require admin session authentication (`require_admin_session` dependency).

#### 1. Create Offer

**POST** `/api/v1/admin/offers`

**Request Body:**
```json
{
  "code": "LAUNCH2026",
  "name": "2026 Launch Offer",
  "description": "6-month Pro tier with auto-downgrade to Free",
  "offer_type": "tier_upgrade",
  "domain": "subscription",
  "target_tier": "pro",
  "duration_months": 6,
  "auto_downgrade_after_months": 6,
  "downgrade_to_tier": "free",
  "max_redemptions": 100,
  "max_redemptions_per_professional": 1,
  "valid_from": "2026-04-15T00:00:00Z",
  "valid_until": "2026-07-15T23:59:59Z",
  "is_active": true
}
```

**Response:** 201 Created
```json
{
  "id": 1,
  "code": "LAUNCH2026",
  "name": "2026 Launch Offer",
  "offer_type": "tier_upgrade",
  "target_tier": "pro",
  "duration_months": 6,
  "auto_downgrade_after_months": 6,
  "is_active": true,
  "created_at": "2026-04-15T12:00:00Z"
}
```

**Validation Rules:**
- `code` must be unique
- `offer_type` must be one of: "tier_upgrade", "tier_discount", "service_discount"
- `domain` must be one of: "subscription", "service", "booking"
- `target_tier` required for tier_upgrade offers
- `duration_months` must be positive integer
- `auto_downgrade_after_months` must be ≤ duration_months (if both set)
- `valid_from` must be valid ISO 8601 timestamp

---

#### 2. List Offers

**GET** `/api/v1/admin/offers?include_inactive=false`

**Query Parameters:**
- `include_inactive` (boolean, optional): Include inactive offers (default: false)

**Response:** 200 OK
```json
[
  {
    "id": 1,
    "code": "LAUNCH2026",
    "name": "2026 Launch Offer",
    "description": "6-month Pro tier with auto-downgrade to Free",
    "offer_type": "tier_upgrade",
    "domain": "subscription",
    "target_tier": "pro",
    "duration_months": 6,
    "max_redemptions": 100,
    "is_active": true,
    "usage": {
      "assigned": 25,
      "pending": 2,
      "active": 20,
      "redeemed": 3,
      "expired": 0,
      "revoked": 0
    },
    "created_at": "2026-04-15T12:00:00Z"
  }
]
```

**Usage Summary Calculations:**
- `assigned`: Total assignment count (all statuses)
- `pending`: Status = "pending"
- `active`: Status = "active"
- `redeemed`: Status = "redeemed"
- `expired`: Status = "expired"
- `revoked`: Status = "revoked"

---

#### 3. Assign Offer

**POST** `/api/v1/admin/offers/assign`

**Request Body:**
```json
{
  "offer_code": "LAUNCH2026",
  "professional_id": "550e8400-e29b-41d4-a716-446655440000",
  "auto_activate": true,
  "notes": "Assigned to early adopter professional"
}
```

**Response:** 201 Created
```json
{
  "id": 42,
  "offer_id": 1,
  "professional_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "assigned_at": "2026-04-15T14:30:00Z",
  "activated_at": "2026-04-15T14:30:00Z",
  "expires_at": "2026-10-15T14:30:00Z",
  "notes": "Assigned to early adopter professional"
}
```

**Behavior:**
- If `auto_activate=true`:
  - Creates `ProfessionalSubscription` record with subscription_type="offer_redemption"
  - Updates `professionals.membership_tier` to target_tier
  - Sets `auto_downgrade_at` = activated_at + auto_downgrade_after_months
  - Status = "active"
- If `auto_activate=false`:
  - Status = "pending"
  - Professional must manually activate (future feature)

**Validation:**
- Offer must exist and be active
- Professional must exist
- Check `max_redemptions` not exceeded
- Check `max_redemptions_per_professional` not exceeded
- Offer must be within validity period

---

#### 4. List Assignments

**GET** `/api/v1/admin/offers/assignments?status=active&offer_code=LAUNCH2026&limit=50&offset=0`

**Query Parameters:**
- `status` (string, optional): Filter by status
- `offer_code` (string, optional): Filter by offer code
- `limit` (int, optional): Page size (default: 50, max: 500)
- `offset` (int, optional): Pagination offset (default: 0)

**Response:** 200 OK
```json
[
  {
    "id": 42,
    "offer_id": 1,
    "offer_code": "LAUNCH2026",
    "professional_id": "550e8400-e29b-41d4-a716-446655440000",
    "professional_name": "Dr. Jane Smith",
    "status": "active",
    "assigned_at": "2026-04-15T14:30:00Z",
    "activated_at": "2026-04-15T14:30:00Z",
    "expires_at": "2026-10-15T14:30:00Z",
    "notes": "Assigned to early adopter professional"
  }
]
```

---

#### 5. Run Auto-Downgrade Maintenance

**POST** `/api/v1/admin/offers/maintenance/auto-downgrade`

**Request Body:** None

**Response:** 200 OK
```json
{
  "downgrades_processed": 5,
  "grace_notifications_sent": 12,
  "expired_assignments_marked": 3
}
```

**Behavior:**
1. Find subscriptions with `auto_downgrade_at <= NOW()`
2. Downgrade tier to `auto_downgrade_to_tier`
3. Set subscription `ends_at` to NOW()
4. Mark offer_assignment as "expired"
5. Find subscriptions with `auto_downgrade_at BETWEEN NOW() AND NOW() + 7 days`
6. Send grace period notifications to professionals
7. Mark assignments with `expires_at <= NOW()` as "expired"

**Scheduling:** This endpoint should be called by a cron job or systemd timer. See "Background Maintenance" section below.

---

#### 6. Update Professional Tier (Enhanced)

**PATCH** `/api/v1/admin/professionals/{professional_id}/tier`

**Request Body:**
```json
{
  "new_tier": "pro",
  "offer_code": "LAUNCH2026"
}
```

**Response:** 200 OK
```json
{
  "professional_id": "550e8400-e29b-41d4-a716-446655440000",
  "old_tier": "free",
  "new_tier": "pro",
  "subscription_type": "offer_redemption",
  "offer_assignment_id": 42,
  "auto_downgrade_at": "2026-10-15T14:30:00Z"
}
```

**Enhancement:** If `offer_code` is provided:
- Validates offer exists and is active
- Creates offer_assignment with auto_activate=true
- Links subscription to offer_assignment
- Sets auto_downgrade fields

---

## Admin UI Guide

### Accessing Offers Management

1. Navigate to `http://localhost:3001/dashboard/offers`
2. Ensure you're logged in as admin

### Creating an Offer

1. Fill out the **Create Offer** form:
   - **Code**: Unique identifier (e.g., "LAUNCH2026", "SUMMER50")
   - **Name**: Display name for admin reference
   - **Description**: Marketing description (optional)
   - **Offer Type**: Select "Tier Upgrade" (service discounts future feature)
   - **Target Tier**: "pro", "elite", or "celeb"
   - **Duration (Months)**: How long the tier lasts (e.g., 6 for 6 months)
   - **Auto-Downgrade After (Months)**: When to trigger downgrade (≤ duration)
   - **Downgrade To Tier**: Target tier after expiry (typically "free")
   - **Max Redemptions**: Global usage limit (leave empty for unlimited)
   - **Max Per Professional**: Per-user limit (default: 1)
   - **Valid Until**: Offer expiry date (optional)
   - **Active**: Toggle to activate offer

2. Click **Create Offer**
3. Verify offer appears in **Offer Catalog** below

### Assigning an Offer

1. Scroll to **Assign Offer to Professional** section
2. Select offer from dropdown (shows usage stats)
3. Enter professional's UUID in **Professional ID** field
   - Find UUIDs via Professionals page or database query
4. Add admin notes (optional)
5. Click **Assign Offer**
6. Verify assignment appears in **Recent Assignments** list below

**Auto-Activation:**
- Offers are auto-activated immediately upon assignment
- Professional's tier is upgraded
- Subscription created with auto-downgrade timer set

### Viewing Offer Catalog

The **Offer Catalog** displays:
- Offer code and name
- Target tier and duration
- Usage stats: Assigned / Active / Redeemed
- Created date and status badge

**Usage Stats:**
- **Assigned**: Total assignments (all statuses)
- **Active**: Currently active offers
- **Redeemed**: Successfully redeemed offers

### Recent Assignments

Shows last 20 assignments with:
- Professional name and UUID
- Offer code
- Status badge (color-coded)
- Assignment and activation timestamps

### Running Maintenance

Click **Run Maintenance** button to manually trigger:
- Auto-downgrade processing
- Grace period notifications
- Expired assignment cleanup

**Recommended:** Schedule this via cron job rather than manual clicks. See "Background Maintenance" below.

---

## Background Maintenance

### Maintenance Worker Script

**Location:** `backend/app/scripts/offers_maintenance.py`

**Purpose:**
- Process auto-downgrades when `auto_downgrade_at` timestamp is reached
- Send 7-day grace period notifications
- Mark expired assignments

**Usage:**

```bash
# Run once (for testing)
cd backend
python -m app.scripts.offers_maintenance --once

# Run continuously with 1-hour interval
python -m app.scripts.offers_maintenance --interval-seconds 3600
```

**Arguments:**
- `--once`: Run single maintenance cycle then exit (default: false)
- `--interval-seconds`: Seconds between maintenance cycles (default: 3600)

### Scheduling Options

#### Option 1: systemd Timer (Linux Production)

**Service File:** `/etc/systemd/system/offers-maintenance.service`
```ini
[Unit]
Description=Wolistic Offers Auto-Downgrade Maintenance
After=network.target

[Service]
Type=oneshot
User=wolistic
WorkingDirectory=/opt/wolistic/backend
ExecStart=/opt/wolistic/venv/bin/python -m app.scripts.offers_maintenance --once
Environment="DATABASE_URL=postgresql://user:pass@localhost/wolistic_db"

[Install]
WantedBy=multi-user.target
```

**Timer File:** `/etc/systemd/system/offers-maintenance.timer`
```ini
[Unit]
Description=Run Offers Maintenance Every Hour

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
```

**Enable:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable offers-maintenance.timer
sudo systemctl start offers-maintenance.timer
sudo systemctl status offers-maintenance.timer
```

#### Option 2: Docker Compose (Development)

Add to `docker-compose.yml`:
```yaml
services:
  offers-worker:
    build: .
    container_name: offers-worker
    command: python -m app.scripts.offers_maintenance --interval-seconds 3600
    depends_on:
      - db
    environment:
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
```

#### Option 3: Cron Job (Simple)

```bash
# Edit crontab
crontab -e

# Add hourly job
0 * * * * cd /opt/wolistic/backend && /opt/wolistic/venv/bin/python -m app.scripts.offers_maintenance --once >> /var/log/wolistic/offers-maintenance.log 2>&1
```

**Recommended Frequency:**
- **Production:** Every 1 hour (3600 seconds)
- **High-volume:** Every 15 minutes (900 seconds)
- **Low-priority:** Every 6 hours (21600 seconds)

---

## Testing Checklist

### Database Verification

```sql
-- Check offers table
SELECT id, code, name, offer_type, is_active FROM offers;

-- Check assignments
SELECT 
  oa.id, 
  o.code, 
  p.full_name, 
  oa.status, 
  oa.activated_at, 
  oa.expires_at
FROM offer_assignments oa
JOIN offers o ON oa.offer_id = o.id
JOIN professionals p ON oa.professional_id = p.user_id
ORDER BY oa.assigned_at DESC
LIMIT 10;

-- Check subscriptions with offers
SELECT 
  ps.professional_id,
  ps.current_tier,
  ps.subscription_type,
  ps.auto_downgrade_at,
  ps.auto_downgrade_to_tier,
  o.code
FROM professional_subscriptions ps
LEFT JOIN offer_assignments oa ON ps.offer_assignment_id = oa.id
LEFT JOIN offers o ON oa.offer_id = o.id
WHERE ps.subscription_type = 'offer_redemption';
```

### API Testing

```python
import requests
from datetime import datetime, timezone, timedelta

base_url = 'http://localhost:8000/api/v1'
session = requests.Session()
# Add authentication here (session cookie or JWT)

# Test 1: Create offer
response = session.post(f'{base_url}/admin/offers', json={
    'code': 'TEST2026',
    'name': 'Test Offer',
    'offer_type': 'tier_upgrade',
    'domain': 'subscription',
    'target_tier': 'pro',
    'duration_months': 3,
    'valid_from': datetime.now(timezone.utc).isoformat(),
    'is_active': True
})
assert response.status_code == 201, f"Create failed: {response.text}"
offer_id = response.json()['id']

# Test 2: List offers
response = session.get(f'{base_url}/admin/offers')
assert response.status_code == 200
offers = response.json()
assert any(o['code'] == 'TEST2026' for o in offers)

# Test 3: Assign offer
response = session.post(f'{base_url}/admin/offers/assign', json={
    'offer_code': 'TEST2026',
    'professional_id': 'YOUR_PROFESSIONAL_UUID_HERE',
    'auto_activate': True
})
assert response.status_code == 201
assignment_id = response.json()['id']
assert response.json()['status'] == 'active'

# Test 4: Verify tier upgrade
response = session.get(f'{base_url}/admin/professionals/YOUR_PROFESSIONAL_UUID_HERE')
assert response.json()['membership_tier'] == 'pro'

print("All tests passed!")
```

### Frontend Testing

1. Navigate to http://localhost:3001/dashboard/offers
2. Create offer with code "UITEST2026"
3. Verify offer appears in catalog with usage: 0/0/0
4. Find a professional UUID from Professionals page
5. Assign offer to professional
6. Verify assignment appears in Recent Assignments list
7. Navigate to Professionals page
8. Find professional and verify tier is "Pro"
9. Check Professional Upgrade dialog shows dynamic offers

---

## Troubleshooting

### Migration Failures

**Error:** `relation "ix_offers_offer_type" already exists`

**Cause:** Migration partially applied, then re-run

**Solution:** Migrations are now idempotent (use IF NOT EXISTS checks). Simply re-run:
```bash
docker exec backend alembic upgrade head
```

---

### Backend Not Showing Routes

**Symptoms:** 404 errors on `/api/v1/admin/offers` endpoints

**Diagnosis:**
```bash
docker logs backend --tail 50
```

Look for:
- `Application startup complete.` (backend started)
- No import errors for `app.services.offers` or `app.models.offer`

**Solution:**
```bash
docker restart backend
```

---

### Auto-Downgrade Not Triggering

**Symptoms:** Professionals still on Pro tier after `auto_downgrade_at` passed

**Diagnosis:**
```sql
SELECT 
  professional_id,
  current_tier,
  auto_downgrade_at,
  auto_downgrade_to_tier
FROM professional_subscriptions
WHERE auto_downgrade_at < NOW()
  AND subscription_type = 'offer_redemption';
```

**Solution:**
1. Verify maintenance job is running:
   ```bash
   # Check cron logs
   grep offers-maintenance /var/log/syslog
   
   # Or check systemd timer
   systemctl status offers-maintenance.timer
   ```

2. Run manually:
   ```bash
   cd backend
   python -m app.scripts.offers_maintenance --once
   ```

3. Check results:
   ```bash
   curl -X POST http://localhost:8000/api/v1/admin/offers/maintenance/auto-downgrade
   ```

---

### Frontend Not Loading Offers

**Symptoms:** Empty offer list in admin UI

**Browser Console:**
```
TypeError: Cannot read property 'map' of undefined
```

**Solution:**
1. Check API response:
   ```bash
   curl http://localhost:8000/api/v1/admin/offers
   ```

2. Verify authentication:
   - Check browser cookies for admin session
   - Try re-logging into admin panel

3. Check CORS settings in `backend/app/main.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3001"],
       allow_credentials=True,
   )
   ```

---

## Security Considerations

### Admin-Only Access

All offer management endpoints require admin authentication:
- Uses `require_admin_session` dependency
- Validates `session_token` from cookies
- Checks `users.is_admin = true` flag

**Enforcement:**
```python
@router.post("/admin/offers")
async def create_offer(
    offer_data: OfferCreate,
    session: AsyncSession = Depends(get_session),
    current_user = Depends(require_admin_session)
):
    # Only admins can reach this code
    pass
```

### Audit Trail

All offer assignments are logged in `offer_assignments` table:
- `assigned_by`: Admin user who created assignment
- `assigned_at`: Timestamp of assignment
- `revoked_by`: Admin user who revoked offer (if applicable)
- `revoke_reason`: Reason for revocation

**Query audit history:**
```sql
SELECT 
  oa.id,
  o.code,
  p.full_name AS professional,
  u.email AS assigned_by,
  oa.assigned_at,
  oa.status
FROM offer_assignments oa
JOIN offers o ON oa.offer_id = o.id
JOIN professionals p ON oa.professional_id = p.user_id
JOIN users u ON oa.assigned_by = u.id
ORDER BY oa.assigned_at DESC;
```

### Rate Limiting

Consider adding rate limiting for offer assignment endpoint:
```python
# Example using slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/admin/offers/assign")
@limiter.limit("10/minute")
async def assign_offer(...):
    pass
```

---

## Performance Optimization

### Database Indexes

All critical query paths are indexed:
- `offers.code` (unique): Fast offer lookup by code
- `offer_assignments.professional_id`: Fast assignment lookup by professional
- `offer_assignments.status`: Fast filtering by status
- `professional_subscriptions.auto_downgrade_at`: Fast maintenance job queries

**Query Plan Verification:**
```sql
EXPLAIN ANALYZE
SELECT * FROM offer_assignments
WHERE professional_id = '550e8400-e29b-41d4-a716-446655440000'
  AND status = 'active';
```

Expected: `Index Scan using ix_offer_assignments_professional_status`

### Caching

Consider caching active offers list (changes infrequently):
```python
from functools import lru_cache
import time

@lru_cache(maxsize=1)
def get_active_offers_cached(cache_bust: int):
    # cache_bust = current_time // 300 (5-minute cache)
    return db.query(Offer).filter(Offer.is_active == True).all()

# Usage
cache_key = int(time.time()) // 300
offers = get_active_offers_cached(cache_key)
```

### Pagination

List endpoints use offset/limit pagination:
- Default limit: 50
- Max limit: 500 (prevents large result sets)

**Frontend best practice:**
```typescript
const [page, setPage] = useState(0);
const limit = 50;

const { data } = useQuery(['assignments', page], () =>
  adminApi.offers.listAssignments({ limit, offset: page * limit })
);
```

---

## Future Enhancements

### Phase 2 Features (Planned)

1. **Service-Level Discounts**
   - Discount booking fees by percentage or fixed amount
   - Offer types: "service_discount" with discount_type and discount_value

2. **Professional Self-Activation**
   - Public endpoint for professionals to redeem offers
   - Offer code validation without admin intervention

3. **Bulk Assignment**
   - CSV upload for batch assignment
   - Assign offers to professional segments (e.g., all pros in region)

4. **Analytics Dashboard**
   - Offer performance metrics (conversion rate, redemption rate)
   - Cohort analysis (pros who redeemed vs didn't)
   - Revenue impact tracking

5. **Grace Period Customization**
   - Configure grace_period_days per offer (currently hardcoded to 7)
   - Multiple notification schedule (7 days, 3 days, 1 day before downgrade)

6. **Offer Templates**
   - Pre-configured offer templates (e.g., "3-Month Trial", "Annual Upgrade")
   - Clone existing offers with new code

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review backend logs: `docker logs backend --tail 100`
3. Check database state with SQL queries in "Database Verification" section
4. Review Alembic migration history: `docker exec backend alembic history`

**Emergency Rollback:**
```bash
# Rollback to before offers feature
docker exec backend alembic downgrade 529aad72bfd6
docker exec backend alembic downgrade 65bc9ade386e
docker exec backend alembic downgrade 3d6c0cd07c7a
docker restart backend
```

---

## Version History

- **v1.0.0** (2026-04-15): Initial implementation
  - Phase 1A: Admin-only offer creation and assignment
  - Phase 1B: Auto-downgrade maintenance job
  - Ledger-based audit trail
  - Idempotent migrations
  - Admin UI with catalog and assignment forms
