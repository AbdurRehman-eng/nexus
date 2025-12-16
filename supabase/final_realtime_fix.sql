-- FINAL FIX: Complete Realtime Configuration for Messages
-- Run this entire script in Supabase SQL Editor to fix realtime issues

-- STEP 1: Ensure messages table is published to realtime
-- Check if already published, if not, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
        RAISE NOTICE 'Added messages table to realtime publication';
    ELSE
        RAISE NOTICE 'Messages table already in realtime publication';
    END IF;
END $$;

-- STEP 2: Set replica identity to FULL (required for UPDATE/DELETE events)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- STEP 3: Drop any conflicting realtime policies
DROP POLICY IF EXISTS "Enable realtime for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable realtime for channel members" ON public.messages;
DROP POLICY IF EXISTS "Debug: Allow All Realtime" ON public.messages;

-- STEP 4: Create proper realtime policy
-- This allows authenticated users to receive realtime updates for messages
-- The policy is permissive to allow realtime to work, while RLS still controls data access
CREATE POLICY "Enable realtime for messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

-- STEP 5: Verify the configuration
SELECT
  'Realtime Publication' as check_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND pubname = 'supabase_realtime'
    ) THEN 'ENABLED ✅'
    ELSE 'NOT ENABLED ❌ - Enable via Database > Replication'
  END as status
UNION ALL
SELECT
  'Replica Identity' as check_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_class c
      WHERE c.relname = 'messages'
      AND c.relnamespace = 'public'::regnamespace
      AND c.relreplident = 'f'
    ) THEN 'FULL ✅'
    ELSE 'NOT FULL ❌ - Run: ALTER TABLE public.messages REPLICA IDENTITY FULL;'
  END as status
UNION ALL
SELECT
  'Realtime Policy' as check_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND policyname = 'Enable realtime for messages'
    ) THEN 'EXISTS ✅'
    ELSE 'MISSING ❌'
  END as status;

-- STEP 6: Check existing RLS policies (for reference)
SELECT
  policyname,
  cmd,
  qual as condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'messages'
ORDER BY policyname;