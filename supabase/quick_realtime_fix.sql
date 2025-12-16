-- QUICK FIX: Realtime Configuration for Messages
-- Run this if the full script fails

-- 1. Set replica identity to FULL (safe to run multiple times)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. Drop and recreate realtime policy (safe to run multiple times)
DROP POLICY IF EXISTS "Enable realtime for messages" ON public.messages;
CREATE POLICY "Enable realtime for messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

-- 3. Verify configuration
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND pubname = 'supabase_realtime'
    ) THEN 'Realtime Publication: ENABLED ✅'
    ELSE 'Realtime Publication: NOT ENABLED ❌ - Enable via UI: Database > Replication'
  END as status
UNION ALL
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_class c
      WHERE c.relname = 'messages'
      AND c.relnamespace = 'public'::regnamespace
      AND c.relreplident = 'f'
    ) THEN 'Replica Identity: FULL ✅'
    ELSE 'Replica Identity: NOT FULL ❌'
  END as status
UNION ALL
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND policyname = 'Enable realtime for messages'
    ) THEN 'Realtime Policy: EXISTS ✅'
    ELSE 'Realtime Policy: MISSING ❌'
  END as status;