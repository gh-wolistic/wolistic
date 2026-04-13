-- Verify Supabase Realtime Configuration
-- Run this in your Supabase SQL Editor to check if realtime is properly enabled

-- 1. Check if messages table is in the realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Expected output should include:
-- | schemaname | tablename                |
-- |------------|--------------------------|
-- | public     | messages                 |
-- | public     | conversation_participants|

-- 2. Check RLS policies on messages table
SELECT polname, polcmd, polroles::regrole[], polqual, polwithcheck
FROM pg_policy 
WHERE polrelid = 'messages'::regclass;

-- 3. Verify that the messages table exists and has correct structure  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
