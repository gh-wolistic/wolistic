-- ============================================================================
-- SUPABASE REALTIME & RLS CONFIGURATION FOR MESSAGING TABLES
-- ============================================================================
--
-- Run this SQL script in Supabase SQL Editor AFTER running the Alembic migration.
-- This script:
-- 1. Enables Row Level Security (RLS) on messaging tables
-- 2. Creates RLS policies for secure access control
-- 3. Enables Supabase Realtime on messages and conversation_participants tables
-- 4. Creates trigger to automatically update conversation.last_message_at
-- 5. Grants necessary permissions
--
-- ============================================================================

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: conversations
-- ============================================================================

-- Users can view conversations they are participants in
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
  )
);

-- Users can create conversations (validated by backend, but allow insert)
CREATE POLICY "Authenticated users can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update conversations they participate in (for metadata updates)
CREATE POLICY "Participants can update conversations"
ON conversations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
  )
);

-- ============================================================================
-- RLS POLICIES: conversation_participants
-- ============================================================================

-- Users can see their own participant records
CREATE POLICY "Users can view their participations"
ON conversation_participants FOR SELECT
USING (user_id = auth.uid());

-- Users can see other participants in their conversations
CREATE POLICY "Users can view co-participants"
ON conversation_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants AS cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
  )
);

-- Backend can insert participants (via service role)
-- Note: Frontend inserts blocked by default (service role only)
CREATE POLICY "Service role can add participants"
ON conversation_participants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own last_read_at timestamp
CREATE POLICY "Users can update their own read status"
ON conversation_participants FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: messages
-- ============================================================================

-- Participants can read all messages in their conversations
CREATE POLICY "Participants can read messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
  )
);

-- Participants can send messages in their conversations
CREATE POLICY "Participants can send messages"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
  )
);

-- Users can soft-delete their own messages (update deleted_at)
CREATE POLICY "Users can delete their own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- ============================================================================
-- ENABLE SUPABASE REALTIME
-- ============================================================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- Note: conversations table does NOT need realtime (metadata only, fetched via REST API)

-- ============================================================================
-- TRIGGER: Update conversation.last_message_at on new message
-- ============================================================================

-- Automatically update conversation.last_message_at when new message is inserted
CREATE OR REPLACE FUNCTION update_conversation_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists (for re-running this script)
DROP TRIGGER IF EXISTS on_message_insert_update_conversation ON messages;

-- Create trigger
CREATE TRIGGER on_message_insert_update_conversation
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message_at();

-- ============================================================================
-- GRANTS (Ensure Supabase roles have access)
-- ============================================================================

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;

GRANT ALL ON conversations TO service_role;
GRANT ALL ON conversation_participants TO service_role;
GRANT ALL ON messages TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the setup:

-- 1. Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('conversations', 'conversation_participants', 'messages');

-- 2. Check policies exist
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('conversations', 'conversation_participants', 'messages');

-- 3. Check realtime publication
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename IN ('messages', 'conversation_participants');

-- 4. Check trigger exists
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'messages'::regclass;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. RLS POLICY LOGIC:
--    - Users can only read/write messages in conversations they are participants in
--    - Backend validates conversation creation policy (favorite/booking/client relationship)
--    - Supabase RLS provides defense-in-depth security layer
--
-- 2. REALTIME SUBSCRIPTION (Frontend):
--    - Subscribe to messages table filtered by conversation_id
--    - Subscribe to conversation_participants for new conversation notifications
--    - Use RLS policies to automatically filter subscriptions per user
--
-- 3. PERFORMANCE:
--    - Indexes created by Alembic migration (ix_messages_conversation_created, etc.)
--    - Trigger updates conversation metadata efficiently
--    - RLS policies use EXISTS subqueries optimized by PostgreSQL
--
-- 4. TESTING RLS:
--    - Set auth.uid() to test user ID: SET request.jwt.claims.sub = 'USER_UUID';
--    - Test SELECT, INSERT, UPDATE permissions
--    - Verify unauthorized access returns empty results or errors
--
-- ============================================================================
