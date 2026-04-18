"""Test ZeptoMail email service integration."""

import asyncio
import sys
from datetime import datetime, timedelta

from app.services.email_service import get_email_service


async def test_welcome_email():
    """Test sending a welcome email."""
    print("Testing welcome email...")
    service = get_email_service()
    
    try:
        result = await service.send_welcome_email(
            to_email="g-superuser@wolistic.com",
            to_name="Wolistic Superuser",
            is_professional=False,
        )
        print(f"✅ Welcome email sent: {result}")
    except Exception as e:
        print(f"❌ Failed to send welcome email: {e}")
        return False
    
    return True


async def test_booking_confirmation():
    """Test sending a booking confirmation email."""
    print("\nTesting booking confirmation...")
    service = get_email_service()
    
    try:
        result = await service.send_booking_confirmation(
            to_email="g-superuser@wolistic.com",
            to_name="Wolistic Superuser",
            professional_name="Dr. Sarah Smith",
            session_type="Yoga & Meditation",
            session_datetime=datetime.now() + timedelta(days=2),
            session_duration_minutes=60,
            booking_id="TEST-BOOKING-001",
            price=999.00,
        )
        print(f"✅ Booking confirmation sent: {result}")
    except Exception as e:
        print(f"❌ Failed to send booking confirmation: {e}")
        return False
    
    return True


async def test_session_reminder():
    """Test sending a session reminder email."""
    print("\nTesting session reminder...")
    service = get_email_service()
    
    try:
        result = await service.send_session_reminder(
            to_email="g-superuser@wolistic.com",
            to_name="Wolistic Superuser",
            professional_name="Dr. Sarah Smith",
            session_type="Yoga & Meditation",
            session_datetime=datetime.now() + timedelta(hours=24),
            hours_before=24,
        )
        print(f"✅ Session reminder sent: {result}")
    except Exception as e:
        print(f"❌ Failed to send session reminder: {e}")
        return False
    
    return True


async def test_password_reset():
    """Test sending a password reset email."""
    print("\nTesting password reset...")
    service = get_email_service()
    
    try:
        result = await service.send_password_reset(
            to_email="g-superuser@wolistic.com",
            to_name="Wolistic Superuser",
            reset_link="https://wolistic.com/reset-password?token=TEST_TOKEN_123",
            expires_in_minutes=60,
        )
        print(f"✅ Password reset sent: {result}")
    except Exception as e:
        print(f"❌ Failed to send password reset: {e}")
        return False
    
    return True


async def main():
    """Run all email tests."""
    print("=" * 50)
    print("ZeptoMail Email Service Test Suite")
    print("=" * 50)
    
    tests = [
        test_welcome_email,
        test_booking_confirmation,
        test_session_reminder,
        test_password_reset,
    ]
    
    results = []
    for test in tests:
        success = await test()
        results.append(success)
    
    print("\n" + "=" * 50)
    print(f"Tests passed: {sum(results)}/{len(results)}")
    print("=" * 50)
    
    if all(results):
        print("✅ All tests passed!")
        sys.exit(0)
    else:
        print("❌ Some tests failed")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
