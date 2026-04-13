"""Send a test message to a user for UI testing - using Supabase client."""

import os
import uuid
from datetime import datetime, timezone

from supabase import create_client, Client


def send_test_message_sync(target_user_id: str, message_content: str):
    """Send a test message to the target user using Supabase."""
    
    # Get Supabase credentials from environment
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_service_key:
        print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set!")
        return
    
    # Create Supabase client with service role key (bypasses RLS)
    supabase: Client = create_client(supabase_url, supabase_service_key)
    
    # Find or create test sender user
    sender_email = "test-sender@wolistic.test"
    result = supabase.table("users").select("*").eq("email", sender_email).execute()
    
    if result.data and len(result.data) > 0:
        sender = result.data[0]
    else:
        # Create test sender
        sender_id = str(uuid.uuid4())
        sender_data = {
            "id": sender_id,
            "email": sender_email,
            "full_name": "Test Sender",
            "user_type": "client",
            "user_subtype": "wellness_seeker",
        }
        result = supabase.table("users").insert(sender_data).execute()
        sender = result.data[0]
        print(f"Created test sender: {sender['id']}")
    
    # Verify target user exists
    result = supabase.table("users").select("*").eq("id", target_user_id).execute()
    
    if not result.data or len(result.data) == 0:
        print(f"ERROR: Target user {target_user_id} not found!")
        return
    
    target_user = result.data[0]
    print(f"Target user: {target_user.get('full_name') or target_user.get('email')} ({target_user['id']})")
    
    # Find existing conversation - query conversation_participants
    result = supabase.table("conversation_participants").select(
        "conversation_id"
    ).in_("user_id", [sender["id"], target_user_id]).execute()
    
    # Find conversation with both users
    from collections import Counter
    conv_ids = [p["conversation_id"] for p in result.data]
    conv_counts = Counter(conv_ids)
    conversation_id = None
    for cid, count in conv_counts.items():
        if count == 2:
            conversation_id = cid
            break
    
    if not conversation_id:
        # Create new conversation
        conversation_id = str(uuid.uuid4())
        conv_data = {
            "id": conversation_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        supabase.table("conversations").insert(conv_data).execute()
        
        # Add participants
        participants = [
            {
                "user_id": sender["id"],
                "conversation_id": conversation_id,
                "joined_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "user_id": target_user_id,
                "conversation_id": conversation_id,
                "joined_at": datetime.now(timezone.utc).isoformat(),
            },
        ]
        supabase.table("conversation_participants").insert(participants).execute()
        print(f"Created new conversation: {conversation_id}")
    else:
        print(f"Using existing conversation: {conversation_id}")
    
    # Send message
    message_id = str(uuid.uuid4())
    message_data = {
        "id": message_id,
        "conversation_id": conversation_id,
        "sender_id": sender["id"],
        "content": message_content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    supabase.table("messages").insert(message_data).execute()
    
    # Update conversation timestamp
    supabase.table("conversations").update({
        "last_message_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", conversation_id).execute()
    
    print(f"✅ Message sent successfully!")
    print(f"   From: {sender.get('full_name') or sender.get('email')}")
    print(f"   To: {target_user.get('full_name') or target_user.get('email')}")
    print(f"   Content: {message_content}")
    print(f"   Conversation ID: {conversation_id}")
    print(f"\nThe user should see this message in the UI now!")


if __name__ == "__main__":
    target_user = "2606f618-e943-47c0-812a-736068f56abf"
    now = datetime.now(timezone.utc)
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S UTC")
    message = f"Test message sent at {timestamp}. Can you see this instantly without refresh? 👋⏰"
    
    send_test_message_sync(target_user, message)
