"""
Scheduled notifications cron job.

Run this script periodically (e.g., hourly) to send:
- Booking reminders (24 hours before session)
- Class expiring notifications (7 days before expiry)
- Follow-up due reminders (for today's follow-ups)

Usage:
    python -m app.scripts.send_scheduled_notifications
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.booking import Booking
from app.models.classes import ClassEnrollment, ClassSession, GroupClass
from app.models.client import ExpertClient, ExpertClientFollowUp
from app.models.notification import Notification
from app.models.professional import Professional
from app.models.user import User
from app.services import notification as notification_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def send_booking_reminders(db: AsyncSession) -> int:
    """
    Send 24-hour booking reminders.
    
    Sends notification to professionals for sessions happening in the next 24-26 hours.
    (26-hour window to account for cron running hourly)
    """
    now = datetime.now(timezone.utc)
    reminder_start = now + timedelta(hours=24)
    reminder_end = now + timedelta(hours=26)
    
    result = await db.execute(
        select(Booking, User, Professional)
        .join(User, User.id == Booking.client_user_id)
        .join(Professional, Professional.user_id == Booking.professional_id)
        .where(
            Booking.status == "confirmed",
            Booking.scheduled_for.is_not(None),
            Booking.scheduled_for >= reminder_start,
            Booking.scheduled_for < reminder_end,
        )
    )
    bookings = result.all()
    
    sent = 0
    for booking, client, professional in bookings:
        # Check if we already sent a reminder (avoid duplicates)
        # You could add a "reminder_sent" flag to booking table or check notifications
        existing_reminder = await db.execute(
            select(Notification).where(
                Notification.user_id == booking.professional_id,
                Notification.extra_data["booking_reference"].astext == booking.booking_reference,
                Notification.type == "schedule",
            )
        )
        if existing_reminder.scalar_one_or_none():
            continue  # Already sent
        
        client_name = client.full_name if client else "Client"
        time_str = booking.scheduled_for.strftime("%I:%M %p on %b %d")
        
        await notification_service.create_notification(
            db,
            user_id=booking.professional_id,
            type="schedule",
            title="📅 Session Tomorrow",
            description=f"Reminder: {client_name} - {booking.service_name} at {time_str}",
            action_url="/v2/partner/body-expert",
            action_text="View Schedule",
            extra_data={
                "booking_reference": booking.booking_reference,
                "booking_id": booking.id,
                "client_name": client_name,
                "scheduled_for": booking.scheduled_for.isoformat()
            }
        )
        sent += 1
    
    await db.commit()
    logger.info(f"Sent {sent} booking reminder notifications")
    return sent


async def send_class_expiring_notifications(db: AsyncSession) -> int:
    """
    Send class expiring notifications (7 days before expiry).
    
    Notifies professionals about classes expiring in the next 7-8 days.
    """
    now = datetime.now(timezone.utc)
    expiry_start = now + timedelta(days=7)
    expiry_end = now + timedelta(days=8)
    
    result = await db.execute(
        select(GroupClass, Professional)
        .join(Professional, Professional.user_id == GroupClass.professional_id)
        .where(
            GroupClass.valid_until.is_not(None),
            GroupClass.valid_until >= expiry_start.date(),
            GroupClass.valid_until < expiry_end.date(),
        )
    )
    classes = result.all()
    
    sent = 0
    for group_class, professional in classes:
        # Check if already sent expiry warning
        existing_notification = await db.execute(
            select(Notification).where(
                Notification.user_id == group_class.professional_id,
                Notification.extra_data["class_id"].astext == str(group_class.id),
                Notification.type == "schedule",
                Notification.title.like("%Expiring%")
            )
        )
        if existing_notification.scalar_one_or_none():
            continue
        
        expiry_date = group_class.valid_until.strftime("%b %d, %Y")
        
        await notification_service.create_notification(
            db,
            user_id=group_class.professional_id,
            type="schedule",
            title="⚠️ Class Expiring Soon",
            description=f"Your class '{group_class.title}' expires on {expiry_date}. Renew to keep students enrolled.",
            action_url="/v2/partner/body-expert/classes",
            action_text="Renew Class",
            extra_data={
                "class_id": group_class.id,
                "class_title": group_class.title,
                "expiry_date": group_class.valid_until.isoformat() if group_class.valid_until else None
            }
        )
        sent += 1
    
    await db.commit()
    logger.info(f"Sent {sent} class expiring notifications")
    return sent


async def send_followup_due_reminders(db: AsyncSession) -> int:
    """
    Send follow-up due reminders for today's follow-ups.
    
    Sends notifications for follow-ups due today that haven't been resolved.
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    result = await db.execute(
        select(ExpertClientFollowUp, ExpertClient)
        .join(ExpertClient, ExpertClient.id == ExpertClientFollowUp.client_id)
        .where(
            ExpertClientFollowUp.due_date >= today_start,
            ExpertClientFollowUp.due_date < today_end,
            ExpertClientFollowUp.resolved.is_(False),
        )
    )
    followups = result.all()
    
    sent = 0
    for followup, client in followups:
        # Check if already sent today's reminder
        existing_reminder = await db.execute(
            select(Notification).where(
                Notification.user_id == followup.professional_id,
                Notification.extra_data["followup_id"].astext == str(followup.id),
                Notification.type == "followup",
                Notification.created_at >= today_start,
            )
        )
        if existing_reminder.scalar_one_or_none():
            continue
        
        await notification_service.create_notification(
            db,
            user_id=followup.professional_id,
            type="followup",
            title="📋 Follow-up Due Today",
            description=f"Reminder: {client.name} - {followup.note[:100] if followup.note else 'Follow-up scheduled'}",
            action_url="/v2/partner/body-expert/clients",
            action_text="View Follow-ups",
            extra_data={
                "followup_id": followup.id,
                "client_id": followup.client_id,
                "client_name": client.name,
                "due_date": followup.due_date.isoformat()
            }
        )
        sent += 1
    
    await db.commit()
    logger.info(f"Sent {sent} follow-up due reminders")
    return sent


async def main():
    """Run all scheduled notification tasks."""
    logger.info("Starting scheduled notifications job...")
    
    async with AsyncSessionLocal() as db:
        try:
            booking_count = await send_booking_reminders(db)
            class_count = await send_class_expiring_notifications(db)
            followup_count = await send_followup_due_reminders(db)
            
            logger.info(
                f"Scheduled notifications job complete: "
                f"{booking_count} booking reminders, "
                f"{class_count} class expiring, "
                f"{followup_count} follow-up reminders"
            )
        except Exception as e:
            logger.error(f"Error in scheduled notifications job: {e}", exc_info=True)
            raise


if __name__ == "__main__":
    asyncio.run(main())
