"""Script to create test notifications for a user."""

import asyncio
import sys
import uuid

from app.core.database import AsyncSessionLocal
from app.services import notification as notification_service


async def create_test_notifications(user_id: uuid.UUID):
    """Create sample notifications for testing."""
    
    async with AsyncSessionLocal() as db:
        notifications = [
            {
                "type": "lead",
                "title": "New Lead Request",
                "description": "Rahul Sharma is interested in your Weight Loss program. Wants to start next week.",
                "action_text": "View Profile",
                "action_url": "/v2/partner/clients",
                "extra_data": {"avatar": "RS"},
            },
            {
                "type": "message",
                "title": "Sneha Patel",
                "description": "Just finished the workout routine you sent! Feeling great 💪",
                "action_text": "Reply",
                "action_url": "/v2/partner/messages",
                "extra_data": {"avatar": "SP"},
            },
            {
                "type": "schedule",
                "title": "Upcoming Session",
                "description": "Yoga Flow with Priya in 30 minutes. Join via Google Meet.",
                "action_text": "Join Call",
                "action_url": "/v2/partner/schedule",
            },
            {
                "type": "followup",
                "title": "Follow-up Required",
                "description": "Check in with Amit Kumar about his new diet plan progress. It's been 3 days.",
                "action_text": "Send Message",
                "action_url": "/v2/partner/messages",
            },
            {
                "type": "system",
                "title": "Profile Optimization",
                "description": "Adding a new introductory video can increase your lead conversion by 20%.",
                "action_text": "Update Profile",
                "action_url": "/v2/partner/profile",
            },
        ]
        
        print(f"Creating {len(notifications)} test notifications for user {user_id}...")
        
        for notif_data in notifications:
            notification = await notification_service.create_notification(
                db,
                user_id=user_id,
                **notif_data,
            )
            print(f"  ✓ Created {notif_data['type']} notification: {notification.id}")
        
        await db.commit()
        print(f"\n✅ Successfully created {len(notifications)} notifications!")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.create_test_notifications <user_id>")
        print("\nExample:")
        print("  python -m scripts.create_test_notifications 2606f618-e943-47c0-812a-736068f56abf")
        sys.exit(1)
    
    try:
        user_id = uuid.UUID(sys.argv[1])
    except ValueError:
        print(f"Error: Invalid UUID format: {sys.argv[1]}")
        sys.exit(1)
    
    asyncio.run(create_test_notifications(user_id))
