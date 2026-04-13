-- COPY AND RUN THIS IN SUPABASE SQL EDITOR
-- Go to: https://supabase.com/dashboard/project/[your-project]/sql/new

-- 1. Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Verify it was added (should show messages in results)
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'messages';

-- If the SELECT above returns a row with 'messages', realtime is enabled ✅
-- If it returns nothing, realtime is NOT enabled ❌
