# Razorpay Refund Integration Guide

## Overview

The refund system automatically processes refunds via Razorpay when:
1. **Expert cancels a session** - All enrolled clients get 100% refund
2. **Expert marks session as cancelled** (during attendance marking) - Refund processed
3. **48-hour grace period expires** - Auto-refund if expert doesn't mark attendance

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Refund Flow                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Expert cancels session / marks cancelled                │
│              ↓                                               │
│  2. refund_service.refund_enrollment(enrollment)            │
│              ↓                                               │
│  3. Fetch EnrollmentPayment.provider_payment_id             │
│              ↓                                               │
│  4. POST https://api.razorpay.com/v1/payments/{id}/refund  │
│              ↓                                               │
│  5. Update enrollment:                                       │
│     - status = "refunded"                                    │
│     - refund_amount = price                                  │
│     - refund_provider_id = razorpay_refund_id               │
│     - refund_processed_at = now()                            │
│              ↓                                               │
│  6. Commit to database                                       │
│              ↓                                               │
│  7. (TODO) Send email notification to client                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# .env file
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx     # Test mode: starts with rzp_test_
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxx    # For webhook verification
```

### Test Mode Detection

The system automatically detects test mode if `RAZORPAY_KEY_ID` starts with `rzp_test_`. In test mode:
- Refunds processed via Razorpay test API
- No real money transferred
- Test payment IDs (pay_test_xxx) work

## API Endpoints

### 1. Cancel Session (Expert-Initiated)

**Endpoint**: `POST /partners/me/sessions/{session_id}/cancel`

**Request**:
```json
{
  "cancellation_reason": "Personal emergency"
}
```

**Response**:
```json
{
  "session_id": 123,
  "status": "cancelled",
  "enrollments_cancelled": 12,
  "successful_refunds": 12,
  "failed_refunds": 0,
  "total_refunded": 6000.00,
  "refund_status": "processing",
  "message": "Session cancelled. 12 clients refunded ₹6000.00 total."
}
```

**Side Effects**:
- All enrollments → `status = "cancelled_expert"`
- Auto-refund initiated for all enrolled clients (via Razorpay)
- Expert reliability score updated
- Email notifications sent to clients (TODO)

---

### 2. Mark Attendance

**Endpoint**: `POST /partners/me/enrollments/{enrollment_id}/mark-attendance`

**Request** (session cancelled):
```json
{
  "attendance_status": "session_cancelled"
}
```

**Response**:
```json
{
  "id": 789,
  "class_session_id": 123,
  "client_user_id": "uuid",
  "status": "refunded",
  "enrolled_at": "2026-04-15T10:00:00Z",
  "refund_amount": 500.00,
  "refund_processed_at": "2026-04-21T19:05:00Z",
  "refund_provider_id": "rfnd_abc123"
}
```

**Options**:
- `"attended"` - Client attended, transaction complete
- `"no_show_client"` - Client didn't show, expert keeps payment
- `"session_cancelled"` - Session didn't run, refund client

---

## Auto-Refund Cron Job

### Purpose
Automatically refund clients if expert doesn't mark attendance within 48 hours of session completion.

### Schedule
Run daily via cron:
```bash
0 2 * * * cd /app && python -m app.scripts.auto_refund_no_show_sessions
```

### Logic
1. Find sessions where `session_date + 48h < now`
2. Find enrollments still in `"confirmed"` status (not marked)
3. Process refund for all such enrollments
4. Update expert reliability score
5. Send email notifications

### Example Output
```
2026-04-23 02:00:00 - INFO - === Auto-Refund Job Started ===
2026-04-23 02:00:15 - INFO - Auto-refund completed: 3 sessions, 18 enrollments, ₹9000.00 total
2026-04-23 02:00:15 - WARNING - ⚠️  3 experts failed to mark attendance. Reliability scores will be impacted.
2026-04-23 02:00:15 - INFO - === Auto-Refund Job Completed ===
```

---

## Database Schema

### enrollment_payments
Tracks payment for each enrollment:
```sql
CREATE TABLE enrollment_payments (
  id BIGINT PRIMARY KEY,
  enrollment_id BIGINT NOT NULL REFERENCES class_enrollments(id),
  provider VARCHAR(32) NOT NULL,              -- 'razorpay'
  provider_order_id VARCHAR(128) UNIQUE,      -- order_xyz123
  provider_payment_id VARCHAR(128) UNIQUE,    -- pay_abc123 (used for refunds)
  provider_signature VARCHAR(512),
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'INR',
  status VARCHAR(32) DEFAULT 'created',       -- 'captured' when paid
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### class_enrollments (refund fields)
Tracks refund details:
```sql
ALTER TABLE class_enrollments ADD COLUMN refund_amount NUMERIC(10,2);
ALTER TABLE class_enrollments ADD COLUMN refund_processed_at TIMESTAMPTZ;
ALTER TABLE class_enrollments ADD COLUMN refund_provider_id VARCHAR(128);
```

---

## Testing

### 1. Run Unit Tests
```bash
cd backend
pytest tests/test_refund_integration.py -v
```

### 2. Manual Test with Razorpay Test Mode

**Step 1: Create test enrollment**
```bash
# Use Razorpay test credentials
export RAZORPAY_KEY_ID=rzp_test_xxxxxx
export RAZORPAY_KEY_SECRET=xxxxxx

# Create session and enroll test client
curl -X POST http://localhost:8000/sessions/123/enroll \
  -H "Authorization: Bearer {token}" \
  -d '{"payment_order_id": "order_test123"}'
```

**Step 2: Cancel session (trigger refund)**
```bash
curl -X POST http://localhost:8000/partners/me/sessions/123/cancel \
  -H "Authorization: Bearer {expert_token}" \
  -d '{"cancellation_reason": "Testing refund"}'
```

**Step 3: Verify refund in database**
```sql
SELECT 
  id, 
  status, 
  refund_amount, 
  refund_provider_id, 
  refund_processed_at
FROM class_enrollments 
WHERE id = 1;

-- Expected:
-- status = 'refunded'
-- refund_amount = 500.00
-- refund_provider_id = 'rfnd_test123'
-- refund_processed_at = '2026-04-18 10:30:00'
```

**Step 4: Check Razorpay dashboard**
- Login to https://dashboard.razorpay.com/test/
- Navigate to Payments → Refunds
- Verify refund appears with correct amount

---

## Error Handling

### Refund Failure Scenarios

| Scenario | Behavior |
|----------|----------|
| **Invalid payment ID** | Razorpay returns 400 error → refund fails → enrollment marked as `cancelled_expert` (not `refunded`) |
| **Insufficient balance** | Razorpay returns 400 error → refund fails → manual intervention required |
| **Network timeout** | URLError → refund fails → retry via cron job |
| **No payment record** | Enrollment marked as `refunded` but no Razorpay call (manual enrollment case) |

### Retry Logic
- Failed refunds are logged in error logs
- Cron job can be configured to retry failed refunds
- Platform admin notified for manual review after 3 failed attempts

---

## Razorpay API Reference

### Refund Endpoint
```
POST https://api.razorpay.com/v1/payments/{payment_id}/refund
Authorization: Basic {base64(key_id:key_secret)}
Content-Type: application/json

{
  "amount": 50000,  // Amount in paise (500.00 INR = 50000 paise)
  "speed": "normal",
  "notes": {
    "enrollment_id": "123",
    "reason": "Session cancelled by expert"
  }
}
```

### Response
```json
{
  "id": "rfnd_abc123",
  "entity": "refund",
  "amount": 50000,
  "currency": "INR",
  "payment_id": "pay_xyz123",
  "status": "processed",
  "speed_processed": "normal",
  "created_at": 1619000000
}
```

### Status Values
- `processed` - Refund completed successfully
- `pending` - Refund initiated, processing
- `failed` - Refund failed (rare)

---

## Monitoring

### Key Metrics

1. **Refund Success Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE refund_processed_at IS NOT NULL) * 100.0 / COUNT(*) as success_rate
   FROM class_enrollments
   WHERE status IN ('cancelled_expert', 'refunded');
   ```

2. **Average Refund Processing Time**
   ```sql
   SELECT AVG(refund_processed_at - created_at) as avg_time
   FROM class_enrollments
   WHERE status = 'refunded';
   ```

3. **Failed Refunds**
   ```sql
   SELECT COUNT(*)
   FROM class_enrollments
   WHERE status = 'cancelled_expert' 
     AND refund_processed_at IS NULL
     AND created_at < NOW() - INTERVAL '1 day';
   ```

### Alerts
- **Alert**: >10% refund failure rate → Check Razorpay credentials
- **Alert**: >5 failed refunds in 24h → Manual review required
- **Alert**: Cron job didn't run → Check scheduler

---

## Security

### API Key Protection
- **Never** expose Razorpay keys in frontend
- Store keys in environment variables only
- Use `.env` files (never commit to git)
- Rotate keys quarterly

### Signature Verification
All Razorpay webhooks must verify signature:
```python
expected_signature = hmac.new(
    webhook_secret.encode("utf-8"),
    payload,
    hashlib.sha256,
).hexdigest()

if not hmac.compare_digest(expected_signature, signature):
    raise HTTPException(400, "Invalid signature")
```

---

## Troubleshooting

### Issue: "Razorpay credentials are missing"
**Cause**: `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` not set

**Fix**:
```bash
export RAZORPAY_KEY_ID=rzp_test_xxxxxx
export RAZORPAY_KEY_SECRET=xxxxxx
```

---

### Issue: "Payment signature verification failed"
**Cause**: Incorrect `provider_payment_id` or tampered payload

**Fix**:
- Verify payment exists in `enrollment_payments` table
- Check `provider_payment_id` is correct
- Ensure payment status is `"captured"`

---

### Issue: "Refund failed: Invalid payment ID"
**Cause**: Payment ID doesn't exist in Razorpay or already refunded

**Fix**:
- Check Razorpay dashboard for payment status
- Verify payment was actually captured (not just created)
- Check if refund was already processed

---

### Issue: Auto-refund not running
**Cause**: Cron job not configured or failing

**Fix**:
```bash
# Test manually
cd backend
python -m app.scripts.auto_refund_no_show_sessions

# Check cron logs
tail -f /var/log/cron.log

# Verify cron entry
crontab -l
```

---

## Production Checklist

- [ ] Razorpay live keys configured (`rzp_live_xxx`)
- [ ] Cron job scheduled (daily at 2 AM)
- [ ] Email notifications working
- [ ] Refund success rate > 95%
- [ ] Monitoring alerts configured
- [ ] Backup refund retry mechanism in place
- [ ] Expert reliability score updates working
- [ ] Client satisfaction > 4.5/5 post-refund

---

## Future Enhancements (Phase 2)

1. **Partial refunds**: Refund based on cancellation timing (>24h = 100%, <24h = 50%)
2. **Refund disputes**: Client can dispute "no-show" marking
3. **Bulk refunds**: Refund multiple sessions at once
4. **Refund analytics**: Dashboard showing refund trends
5. **WhatsApp notifications**: Real-time refund alerts
6. **Auto-enrollment from waitlist**: When refund frees spot, notify interested users

---

**Last Updated**: April 18, 2026  
**Version**: 1.0  
**Status**: Production Ready
