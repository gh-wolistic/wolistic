"""
Test Razorpay refund integration.

Run with:
    pytest backend/tests/test_refund_integration.py -v
"""

import pytest
from decimal import Decimal
from datetime import datetime, date, time
from unittest.mock import Mock, patch, AsyncMock

from app.services.refund_service import (
    process_razorpay_refund,
    refund_enrollment,
    refund_all_session_enrollments,
)
from app.models.classes import (
    ClassEnrollment,
    ClassSession,
    GroupClass,
    EnrollmentPayment,
)


@pytest.mark.asyncio
async def test_razorpay_refund_api_success():
    """Test successful Razorpay refund API call."""
    with patch('app.services.refund_service.urllib_request') as mock_urllib:
        # Mock successful API response
        mock_response = Mock()
        mock_response.read.return_value = b'{"id": "rfnd_test123", "status": "processed", "amount": 50000}'
        mock_response.__enter__ = Mock(return_value=mock_response)
        mock_response.__exit__ = Mock(return_value=False)
        
        mock_urllib.urlopen.return_value = mock_response
        
        result = await process_razorpay_refund(
            payment_id="pay_test123",
            refund_amount=500.00,
            enrollment_id=1
        )
        
        assert result["success"] is True
        assert result["refund_id"] == "rfnd_test123"
        assert result["status"] == "completed"
        assert result["error"] is None


@pytest.mark.asyncio
async def test_razorpay_refund_api_failure():
    """Test Razorpay refund API failure."""
    from urllib.error import HTTPError
    
    with patch('app.services.refund_service.urllib_request') as mock_urllib:
        # Mock API error
        mock_error = HTTPError(
            url="https://api.razorpay.com/v1/payments/pay_test/refund",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=Mock(read=Mock(return_value=b'{"error": "Invalid payment ID"}'))
        )
        mock_urllib.urlopen.side_effect = mock_error
        
        result = await process_razorpay_refund(
            payment_id="pay_invalid",
            refund_amount=500.00,
            enrollment_id=1
        )
        
        assert result["success"] is False
        assert result["refund_id"] is None
        assert result["status"] == "failed"
        assert "Invalid payment ID" in result["error"]


@pytest.mark.asyncio
async def test_refund_enrollment_with_payment(mock_db_session):
    """Test refund_enrollment with valid payment record."""
    # Create mock enrollment
    enrollment = ClassEnrollment(
        id=1,
        class_session_id=10,
        client_user_id="client-uuid",
        status="confirmed",
    )
    
    # Create mock session and class
    session = ClassSession(
        id=10,
        group_class_id=5,
        session_date=date(2026, 4, 21),
        start_time=time(6, 0),
        status="published",
    )
    
    group_class = GroupClass(
        id=5,
        professional_id="prof-uuid",
        title="Morning Yoga",
        category="yoga",
        price=Decimal("500.00"),
    )
    
    # Create mock payment
    payment = EnrollmentPayment(
        id=1,
        enrollment_id=1,
        provider="razorpay",
        provider_payment_id="pay_test123",
        status="captured",
        amount=Decimal("500.00"),
    )
    
    # Mock database queries
    with patch.object(mock_db_session, 'execute') as mock_execute:
        # First query: fetch session and class
        mock_result1 = AsyncMock()
        mock_result1.one_or_none.return_value = (session, group_class)
        
        # Second query: fetch payment
        mock_result2 = AsyncMock()
        mock_result2.scalar_one_or_none.return_value = payment
        
        mock_execute.side_effect = [mock_result1, mock_result2]
        
        # Mock Razorpay API call
        with patch('app.services.refund_service.process_razorpay_refund') as mock_refund:
            mock_refund.return_value = {
                "success": True,
                "refund_id": "rfnd_test123",
                "error": None,
                "status": "completed"
            }
            
            result = await refund_enrollment(mock_db_session, enrollment)
            
            assert result is True
            assert enrollment.status == "refunded"
            assert enrollment.refund_amount == 500.00
            assert enrollment.refund_provider_id == "rfnd_test123"
            assert enrollment.refund_processed_at is not None


@pytest.mark.asyncio
async def test_refund_enrollment_no_payment(mock_db_session):
    """Test refund_enrollment with no payment record (manual enrollment)."""
    # Create mock enrollment
    enrollment = ClassEnrollment(
        id=1,
        class_session_id=10,
        client_user_id="client-uuid",
        status="confirmed",
    )
    
    # Create mock session and class
    session = ClassSession(
        id=10,
        group_class_id=5,
        session_date=date(2026, 4, 21),
        start_time=time(6, 0),
        status="published",
    )
    
    group_class = GroupClass(
        id=5,
        professional_id="prof-uuid",
        title="Morning Yoga",
        category="yoga",
        price=Decimal("500.00"),
    )
    
    # Mock database queries
    with patch.object(mock_db_session, 'execute') as mock_execute:
        # First query: fetch session and class
        mock_result1 = AsyncMock()
        mock_result1.one_or_none.return_value = (session, group_class)
        
        # Second query: fetch payment (returns None)
        mock_result2 = AsyncMock()
        mock_result2.scalar_one_or_none.return_value = None
        
        mock_execute.side_effect = [mock_result1, mock_result2]
        
        result = await refund_enrollment(mock_db_session, enrollment)
        
        # Should fail gracefully but still mark as refunded
        assert result is False
        assert enrollment.status == "refunded"
        assert enrollment.refund_amount == 500.00


@pytest.fixture
def mock_db_session():
    """Create a mock AsyncSession."""
    session = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    return session
