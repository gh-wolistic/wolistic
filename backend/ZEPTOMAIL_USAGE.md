# ZeptoMail Email Service - Usage Examples

## Configuration

Add to your `.env` file:

```bash
# ZeptoMail Configuration
ZEPTOMAIL_API_URL=https://api.zeptomail.in/v1.1/email
ZEPTOMAIL_API_KEY=Zoho-enczapikey PHtE6r0OQrjviDF690II4vDrF8SiPYsqqLxgflJPsYlLDfcEHU1TotwqwGPm/hktVvVCE6bIwYxhtLnJsrqGITy+MWsYXWqyqK3sx/VYSPOZsbq6x00cs18TcEXZVY/vcNJs1SHTut3dNA==
ZEPTOMAIL_FROM_EMAIL=noreply@wolistic.com
ZEPTOMAIL_FROM_NAME=Wolistic
```

## Usage in Route Handlers

### 1. Booking Confirmation Email

```python
from datetime import datetime
from fastapi import APIRouter, Depends
from app.services.email_service import get_email_service, EmailService

router = APIRouter()

@router.post("/bookings")
async def create_booking(
    email_service: EmailService = Depends(get_email_service),
):
    # ... create booking logic ...
    
    # Send confirmation email
    await email_service.send_booking_confirmation(
        to_email="user@example.com",
        to_name="John Doe",
        professional_name="Dr. Sarah Smith",
        session_type="Yoga Session",
        session_datetime=datetime(2026, 4, 20, 10, 0),
        session_duration_minutes=60,
        booking_id="BK123456",
        price=999.00,
    )
    
    return {"status": "success"}
```

### 2. Session Reminder (Background Task)

```python
from fastapi import BackgroundTasks

@router.get("/send-reminders")
async def send_session_reminders(
    background_tasks: BackgroundTasks,
    email_service: EmailService = Depends(get_email_service),
):
    # ... fetch upcoming sessions ...
    
    # Send reminder in background
    background_tasks.add_task(
        email_service.send_session_reminder,
        to_email="user@example.com",
        to_name="John Doe",
        professional_name="Dr. Sarah Smith",
        session_type="Yoga Session",
        session_datetime=datetime(2026, 4, 20, 10, 0),
        hours_before=24,
    )
    
    return {"status": "scheduled"}
```

### 3. Welcome Email on Signup

```python
@router.post("/auth/signup")
async def signup(
    email_service: EmailService = Depends(get_email_service),
):
    # ... create user ...
    
    # Send welcome email
    await email_service.send_welcome_email(
        to_email="newuser@example.com",
        to_name="Jane Doe",
        is_professional=False,  # True for professionals
    )
    
    return {"status": "success"}
```

### 4. Password Reset

```python
@router.post("/auth/forgot-password")
async def forgot_password(
    email_service: EmailService = Depends(get_email_service),
):
    # ... generate reset token ...
    reset_link = f"https://wolistic.com/reset-password?token={token}"
    
    await email_service.send_password_reset(
        to_email="user@example.com",
        to_name="John Doe",
        reset_link=reset_link,
        expires_in_minutes=60,
    )
    
    return {"status": "sent"}
```

### 5. Booking Cancellation

```python
@router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(
    email_service: EmailService = Depends(get_email_service),
):
    # ... cancel booking and process refund ...
    
    await email_service.send_booking_cancelled(
        to_email="user@example.com",
        to_name="John Doe",
        professional_name="Dr. Sarah Smith",
        session_type="Yoga Session",
        session_datetime=datetime(2026, 4, 20, 10, 0),
        refund_amount=999.00,
    )
    
    return {"status": "cancelled"}
```

## Scheduled Reminder Service

Create a background job to send reminders:

```python
# app/tasks/email_reminders.py
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from app.services.email_service import get_email_service
from app.db.session import get_db

async def send_24h_reminders():
    """Send reminders for sessions happening in 24 hours."""
    email_service = get_email_service()
    async for db in get_db():
        # Get sessions happening in 23-25 hours
        tomorrow = datetime.utcnow() + timedelta(hours=24)
        window_start = tomorrow - timedelta(hours=1)
        window_end = tomorrow + timedelta(hours=1)
        
        # ... query sessions ...
        
        for session in sessions:
            try:
                await email_service.send_session_reminder(
                    to_email=session.user_email,
                    to_name=session.user_name,
                    professional_name=session.professional_name,
                    session_type=session.session_type,
                    session_datetime=session.start_time,
                    hours_before=24,
                )
            except Exception as e:
                print(f"Failed to send reminder: {e}")
```

## Testing

```python
# Test in development
import asyncio
from app.services.email_service import get_email_service

async def test_email():
    service = get_email_service()
    result = await service.send_welcome_email(
        to_email="test@example.com",
        to_name="Test User",
        is_professional=False,
    )
    print(result)

asyncio.run(test_email())
```

## Error Handling

The service automatically logs errors and raises `httpx.HTTPError` on failure:

```python
try:
    await email_service.send_booking_confirmation(...)
except httpx.HTTPError as e:
    logger.error(f"Email sending failed: {e}")
    # Continue with booking creation even if email fails
```

## Cost Tracking

At ₹150/10k emails:
- Booking confirmation: 1 email
- 24h reminder: 1 email  
- 1h reminder: 1 email (optional)
- Welcome email: 1 email

**Estimate**: ~4 emails per booking = ~₹0.06 per booking
