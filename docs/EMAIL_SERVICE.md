# Email Service Documentation

**Provider**: ZeptoMail (Zoho)  
**Cost**: ₹150 per 10,000 emails  
**Implementation**: 2026-04-18  
**Status**: ✅ Production-ready

## Overview

Wolistic uses ZeptoMail for all transactional emails (booking confirmations, session reminders, password resets, etc.). The service is integrated via their REST API with async HTTP calls using `httpx`.

## Architecture

- **Service Layer**: `backend/app/services/email_service.py`
- **Configuration**: `backend/app/core/config.py` (Settings class)
- **Integration Pattern**: Singleton service via `get_email_service()` dependency injection
- **API Client**: httpx (async HTTP library)
- **Template Engine**: Native HTML string templates (future: consider Jinja2 for complex templates)

## Configuration

### Environment Variables

Add to `backend/.env`:

```bash
ZEPTOMAIL_API_URL=https://api.zeptomail.in/v1.1/email
ZEPTOMAIL_API_KEY=Zoho-enczapikey YOUR_API_KEY_HERE
ZEPTOMAIL_FROM_EMAIL=noreply@wolistic.com
ZEPTOMAIL_FROM_NAME=Wolistic
```

### ZeptoMail Setup

1. **Domain**: wolistic.com
2. **Agent Alias**: 4e817da18b5bb7c1
3. **API Key**: Configured in environment (Zoho-enczapikey format)
4. **DNS Records**: SPF, DKIM, DMARC configured for deliverability

## Available Email Templates

### 1. Welcome Email
**Method**: `send_welcome_email(to_email, to_name, is_professional=False)`

Sent when:
- User completes signup
- Professional completes onboarding

**Personalization**: Different content for users vs professionals

### 2. Booking Confirmation
**Method**: `send_booking_confirmation(to_email, to_name, professional_name, session_type, session_datetime, session_duration_minutes, booking_id, price)`

Sent when:
- Payment is successfully verified
- Booking is confirmed in database

**Includes**: Session details, booking ID, amount paid, link to view booking

### 3. Session Reminder
**Method**: `send_session_reminder(to_email, to_name, professional_name, session_type, session_datetime, hours_before=24)`

Sent when:
- 24 hours before session (recommended)
- 1 hour before session (optional)

**Use case**: Reduce no-shows, improve attendance

### 4. Password Reset
**Method**: `send_password_reset(to_email, to_name, reset_link, expires_in_minutes=60)`

Sent when:
- User requests password reset
- Forgot password flow initiated

**Security**: Link expires in 60 minutes (configurable)

### 5. Booking Cancellation
**Method**: `send_booking_cancelled(to_email, to_name, professional_name, session_type, session_datetime, refund_amount=None)`

Sent when:
- User cancels booking
- Professional cancels session

**Includes**: Cancelled session details, refund amount (if applicable)

### 6. Professional Welcome
**Method**: `send_welcome_email(to_email, to_name, is_professional=True)`

Sent when:
- Professional account is created
- Profile setup is initiated

**Content**: Onboarding checklist, next steps, dashboard link

## Usage Examples

### Basic Usage

```python
from app.services.email_service import get_email_service

# In any route handler or service
email_service = get_email_service()

await email_service.send_booking_confirmation(
    to_email=user.email,
    to_name=user.full_name,
    professional_name=professional.name,
    session_type="Yoga & Meditation",
    session_datetime=booking.start_time,
    session_duration_minutes=60,
    booking_id=str(booking.id),
    price=booking.total_amount,
)
```

### With Dependency Injection

```python
from fastapi import APIRouter, Depends
from app.services.email_service import get_email_service, EmailService

router = APIRouter()

@router.post("/bookings")
async def create_booking(
    email_service: EmailService = Depends(get_email_service),
):
    # ... booking creation logic ...
    
    await email_service.send_booking_confirmation(...)
    
    return {"status": "success"}
```

### Background Task Pattern

```python
from fastapi import BackgroundTasks

@router.post("/bookings")
async def create_booking(
    background_tasks: BackgroundTasks,
    email_service: EmailService = Depends(get_email_service),
):
    # Create booking first
    booking = await create_booking_in_db(...)
    
    # Send email in background (don't block response)
    background_tasks.add_task(
        email_service.send_booking_confirmation,
        to_email=user.email,
        to_name=user.full_name,
        professional_name=professional.name,
        # ... other params
    )
    
    return {"booking_id": booking.id}
```

### Error Handling

```python
import httpx
import logging

logger = logging.getLogger(__name__)

try:
    await email_service.send_booking_confirmation(...)
except httpx.HTTPError as e:
    logger.error(f"Failed to send email: {e}")
    # Continue with booking flow - don't fail entire transaction
    # Optional: queue for retry or notify monitoring
```

## Email Volume Estimates

**Estimated usage** (per 1,000 active users/month):

| Email Type | Volume | Cost @ ₹150/10k |
|------------|--------|-----------------|
| Welcome emails | 200 | ₹3 |
| Booking confirmations | 500 | ₹7.50 |
| Session reminders (24h) | 500 | ₹7.50 |
| Password resets | 50 | ₹0.75 |
| Booking cancellations | 100 | ₹1.50 |
| **Total** | **1,350** | **₹20.25** |

**At scale** (10,000 active users): ~₹200/month

## Testing

### Manual Testing

Run the test suite:

```bash
cd backend
docker-compose exec backend python test_email_service.py
```

Sends 4 test emails to verify:
- Welcome email
- Booking confirmation
- Session reminder
- Password reset

### Integration Testing

```python
# In pytest test file
import pytest
from app.services.email_service import get_email_service

@pytest.mark.asyncio
async def test_booking_confirmation_email(test_booking):
    email_service = get_email_service()
    
    result = await email_service.send_booking_confirmation(
        to_email="test@example.com",
        to_name="Test User",
        # ... test data
    )
    
    assert result["message"] == "OK"
    assert "request_id" in result
```

## Monitoring & Observability

### Success Metrics

- Email sent successfully: `result["message"] == "OK"`
- ZeptoMail provides `request_id` for tracking
- Check ZeptoMail dashboard for delivery rates, bounces, opens

### Error Scenarios

1. **API Key missing**: Service logs warning, returns `{"status": "skipped"}`
2. **Network timeout**: `httpx.TimeoutException` raised (10s timeout)
3. **API error**: `httpx.HTTPStatusError` raised with response details
4. **Invalid email**: ZeptoMail returns error in response

### Logging

All email operations are logged:

```
INFO: Email sent to user@example.com: Booking Confirmed with Dr. Sarah
ERROR: Failed to send email to user@example.com: Connection timeout
```

## Future Enhancements

### Short-term
- [ ] Email templates with Jinja2 for better maintainability
- [ ] Email preview/testing endpoint in dev mode
- [ ] Retry logic with exponential backoff
- [ ] Dead letter queue for failed emails

### Medium-term
- [ ] Email preferences (user opt-in/opt-out per type)
- [ ] A/B testing for email content
- [ ] Email analytics integration (open rates, click rates)
- [ ] Unsubscribe link in footer

### Long-term
- [ ] Multi-language email templates (Hindi, regional languages)
- [ ] SMS integration for critical reminders
- [ ] WhatsApp Business API integration
- [ ] Calendar invite attachments (.ics files)

## Cost Optimization

**Current**: ₹150/10k emails  
**Competitors**: AWS SES (₹80), Resend (₹320), SendGrid (₹560)

**Why ZeptoMail**:
- ✅ Lowest cost for India market
- ✅ INR billing (no forex fees)
- ✅ Good deliverability
- ✅ Local support
- ✅ Transactional-focused

**Scaling considerations**:
- At 100k emails/month: ₹1,500 (~$18)
- At 1M emails/month: ₹15,000 (~$180)
- Volume discounts available from Zoho

## API Reference

See `backend/ZEPTOMAIL_USAGE.md` for detailed API documentation and code examples.

## Support

- **Internal**: `backend/app/services/email_service.py` (source code)
- **ZeptoMail Docs**: https://www.zoho.com/zeptomail/help/
- **Support Email**: support@zeptomail.com
- **Status Page**: https://status.zoho.com/

---

**Last Updated**: 2026-04-18  
**Maintained By**: Backend Team
