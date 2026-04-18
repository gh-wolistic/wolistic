"""Email service using ZeptoMail for transactional emails."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class EmailService:
    """ZeptoMail email service for transactional emails."""

    def __init__(self):
        self.api_url = settings.ZEPTOMAIL_API_URL
        self.api_key = settings.ZEPTOMAIL_API_KEY
        self.from_email = settings.ZEPTOMAIL_FROM_EMAIL
        self.from_name = settings.ZEPTOMAIL_FROM_NAME

    async def _send_email(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        html_body: str,
        reply_to: str | None = None,
    ) -> dict[str, Any]:
        """
        Send an email via ZeptoMail API.

        Args:
            to_email: Recipient email address
            to_name: Recipient name
            subject: Email subject
            html_body: HTML email body
            reply_to: Optional reply-to email address

        Returns:
            API response dict

        Raises:
            httpx.HTTPError: If API request fails
        """
        if not self.api_key:
            logger.warning("ZeptoMail API key not configured. Email not sent.")
            return {"status": "skipped", "message": "Email service not configured"}

        payload = {
            "from": {"address": self.from_email, "name": self.from_name},
            "to": [{"email_address": {"address": to_email, "name": to_name}}],
            "subject": subject,
            "htmlbody": html_body,
        }

        if reply_to:
            payload["reply_to"] = [{"address": reply_to}]

        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": self.api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(self.api_url, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()
                logger.info(f"Email sent to {to_email}: {subject}")
                return result
        except httpx.HTTPError as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            raise

    async def send_booking_confirmation(
        self,
        to_email: str,
        to_name: str,
        professional_name: str,
        session_type: str,
        session_datetime: datetime,
        session_duration_minutes: int,
        booking_id: str,
        price: float,
    ) -> dict[str, Any]:
        """Send booking confirmation email."""
        subject = f"Booking Confirmed with {professional_name}"
        
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2d3748;">Booking Confirmed! 🎉</h2>
            <p>Hi <strong>{to_name}</strong>,</p>
            <p>Your session with <strong>{professional_name}</strong> has been confirmed.</p>
            
            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Session Details</h3>
                <p><strong>Type:</strong> {session_type}</p>
                <p><strong>Date & Time:</strong> {session_datetime.strftime("%B %d, %Y at %I:%M %p")}</p>
                <p><strong>Duration:</strong> {session_duration_minutes} minutes</p>
                <p><strong>Amount Paid:</strong> ₹{price:.2f}</p>
                <p><strong>Booking ID:</strong> {booking_id}</p>
            </div>
            
            <p>We'll send you a reminder before your session.</p>
            <p>View your booking details on <a href="https://wolistic.com/bookings">wolistic.com</a></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px;">
                Questions? Reply to this email or contact us at support@wolistic.com
            </p>
        </div>
        """
        
        return await self._send_email(to_email, to_name, subject, html_body)

    async def send_session_reminder(
        self,
        to_email: str,
        to_name: str,
        professional_name: str,
        session_type: str,
        session_datetime: datetime,
        hours_before: int = 24,
    ) -> dict[str, Any]:
        """Send session reminder email."""
        subject = f"Reminder: Session with {professional_name} in {hours_before}h"
        
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2d3748;">Upcoming Session Reminder ⏰</h2>
            <p>Hi <strong>{to_name}</strong>,</p>
            <p>This is a friendly reminder about your upcoming session.</p>
            
            <div style="background-color: #fef5e7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p><strong>With:</strong> {professional_name}</p>
                <p><strong>Type:</strong> {session_type}</p>
                <p><strong>When:</strong> {session_datetime.strftime("%B %d, %Y at %I:%M %p")}</p>
            </div>
            
            <p>We look forward to seeing you!</p>
            <p><a href="https://wolistic.com/bookings" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Booking</a></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px;">
                Need to reschedule? Contact {professional_name} or support@wolistic.com
            </p>
        </div>
        """
        
        return await self._send_email(to_email, to_name, subject, html_body)

    async def send_password_reset(
        self,
        to_email: str,
        to_name: str,
        reset_link: str,
        expires_in_minutes: int = 60,
    ) -> dict[str, Any]:
        """Send password reset email."""
        subject = "Reset Your Wolistic Password"
        
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2d3748;">Password Reset Request</h2>
            <p>Hi <strong>{to_name}</strong>,</p>
            <p>We received a request to reset your password for your Wolistic account.</p>
            
            <div style="margin: 30px 0;">
                <a href="{reset_link}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
            </div>
            
            <p style="color: #718096;">This link will expire in {expires_in_minutes} minutes.</p>
            <p style="color: #718096;">If you didn't request this, you can safely ignore this email.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px;">
                For security reasons, never share this link with anyone.
            </p>
        </div>
        """
        
        return await self._send_email(to_email, to_name, subject, html_body)

    async def send_welcome_email(
        self,
        to_email: str,
        to_name: str,
        is_professional: bool = False,
    ) -> dict[str, Any]:
        """Send welcome email to new users."""
        subject = "Welcome to Wolistic! 🌟"
        
        if is_professional:
            html_body = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2d3748;">Welcome to Wolistic, {to_name}! 🌟</h2>
                <p>We're excited to have you join our community of wellness professionals.</p>
                
                <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Next Steps:</h3>
                    <ol style="padding-left: 20px;">
                        <li>Complete your professional profile</li>
                        <li>Add your services and availability</li>
                        <li>Upload certifications for verification</li>
                        <li>Start accepting bookings!</li>
                    </ol>
                </div>
                
                <p><a href="https://wolistic.com/dashboard" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Complete Your Profile</a></p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; font-size: 14px;">
                    Questions? Reach out to support@wolistic.com
                </p>
            </div>
            """
        else:
            html_body = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2d3748;">Welcome to Wolistic, {to_name}! 🌟</h2>
                <p>Your journey to holistic wellness starts here.</p>
                
                <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Discover:</h3>
                    <ul style="padding-left: 20px;">
                        <li>Verified wellness professionals</li>
                        <li>Yoga, fitness, nutrition & more</li>
                        <li>Personalized recommendations</li>
                        <li>Easy booking & scheduling</li>
                    </ul>
                </div>
                
                <p><a href="https://wolistic.com/explore" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Explore Professionals</a></p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; font-size: 14px;">
                    Questions? Reach out to support@wolistic.com
                </p>
            </div>
            """
        
        return await self._send_email(to_email, to_name, subject, html_body)

    async def send_booking_cancelled(
        self,
        to_email: str,
        to_name: str,
        professional_name: str,
        session_type: str,
        session_datetime: datetime,
        refund_amount: float | None = None,
    ) -> dict[str, Any]:
        """Send booking cancellation confirmation email."""
        subject = f"Booking Cancelled: {professional_name}"
        
        refund_text = ""
        if refund_amount:
            refund_text = f"<p><strong>Refund Amount:</strong> ₹{refund_amount:.2f} will be credited to your account within 5-7 business days.</p>"
        
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2d3748;">Booking Cancelled</h2>
            <p>Hi <strong>{to_name}</strong>,</p>
            <p>Your booking has been cancelled as requested.</p>
            
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <h3 style="margin-top: 0;">Cancelled Session</h3>
                <p><strong>Professional:</strong> {professional_name}</p>
                <p><strong>Type:</strong> {session_type}</p>
                <p><strong>Was scheduled for:</strong> {session_datetime.strftime("%B %d, %Y at %I:%M %p")}</p>
                {refund_text}
            </div>
            
            <p>We hope to see you book again soon!</p>
            <p><a href="https://wolistic.com/explore" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Find Another Professional</a></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px;">
                Questions? Contact support@wolistic.com
            </p>
        </div>
        """
        
        return await self._send_email(to_email, to_name, subject, html_body)


# Singleton instance
_email_service: EmailService | None = None


def get_email_service() -> EmailService:
    """Get or create the email service singleton."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
