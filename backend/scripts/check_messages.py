"""Check messages in the conversation to see if user replied."""

import os
from supabase import create_client, Client

# Get Supabase credentials
supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_service_key:
    print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set!")
    exit(1)

# Create Supabase client
supabase: Client = create_client(supabase_url, supabase_service_key)

# The conversation ID we've been using
conversation_id = "2417bb4d-1cbc-4c8e-947b-f3fcd7c1c886"

# Fetch all messages in this conversation
result = supabase.table("messages").select(
    "id, sender_id, content, created_at"
).eq("conversation_id", conversation_id).order("created_at").execute()

print(f"\n📨 Messages in conversation {conversation_id}:\n")
print("=" * 80)

for msg in result.data:
    # Get sender info
    sender_result = supabase.table("users").select("full_name, email").eq("id", msg["sender_id"]).single().execute()
    sender_name = sender_result.data.get("full_name") or sender_result.data.get("email") if sender_result.data else "Unknown"
    
    print(f"\n[{msg['created_at']}]")
    print(f"From: {sender_name} ({msg['sender_id']})")
    print(f"Message: {msg['content']}")
    print("-" * 80)

print(f"\n\n✅ Total messages: {len(result.data)}")
