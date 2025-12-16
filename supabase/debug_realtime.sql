-- Troubleshooting Supabase Realtime CHANNEL_ERROR
-- Run these queries to diagnose the issue

-- 1. Check if Realtime is enabled on messages table
SELECT 
  schemaname,
  tablename,
  -- Check if table is published for realtime
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'messages'
      AND pubname = 'supabase_realtime'
    ) THEN 'ENABLED ✅'
    ELSE 'NOT ENABLED ❌'
  END as realtime_status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'messages';

-- 2. If NOT ENABLED, run this to enable it:
-- Go to Supabase Dashboard > Database > Replication
-- Toggle ON for "messages" table
-- OR run this SQL (requires superuser):
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 3. Verify REPLICA IDENTITY is FULL
SELECT 
  relname as table_name,
  CASE relreplident
    WHEN 'd' THEN 'DEFAULT ❌ (need FULL)'
    WHEN 'f' THEN 'FULL ✅'
  END as replica_identity
FROM pg_class 
WHERE relname = 'messages' 
AND relnamespace = 'public'::regnamespace;

-- 4. Check RLS policies that might block realtime
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'messages';
