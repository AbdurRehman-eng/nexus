-- COMPREHENSIVE REALTIME DIAGNOSTICS
-- Run this to identify exactly what's wrong with realtime

-- 1. Check if realtime publication exists and is active
SELECT
  'Publication Status' as check_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    THEN 'Publication exists ✅'
    ELSE 'Publication missing ❌ - Re-create via UI'
  END as status;

-- 2. Check if messages table is in publication
SELECT
  'Messages in Publication' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
    )
    THEN 'Table published ✅'
    ELSE 'Table not published ❌ - Add via Database > Replication'
  END as status;

-- 3. Check replica identity
SELECT
  'Replica Identity' as check_name,
  CASE c.relreplident
    WHEN 'f' THEN 'FULL ✅'
    WHEN 'd' THEN 'DEFAULT ❌ (needs FULL)'
    WHEN 'n' THEN 'NOTHING ❌ (needs FULL)'
    ELSE 'OTHER ❌ (needs FULL)'
  END as status
FROM pg_class c
WHERE c.relname = 'messages'
AND c.relnamespace = 'public'::regnamespace;

-- 4. Check realtime policies
SELECT
  'Realtime Policies' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND policyname LIKE '%realtime%'
    )
    THEN 'Realtime policies exist ✅'
    ELSE 'No realtime policies ❌ - Need realtime policy'
  END as status;

-- 5. Check RLS status on messages table
SELECT
  'RLS Status' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'messages'
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
    )
    THEN 'RLS enabled ✅'
    ELSE 'RLS disabled ❌'
  END as status;

-- 6. List all policies on messages table
SELECT
  'Policy Details' as check_name,
  string_agg(policyname || ' (' || cmd || ')', ', ') as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'messages';

-- 7. Check if user can access the table (simulate realtime user)
SELECT
  'User Access Test' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM messages LIMIT 1
    )
    THEN 'Can access messages ✅'
    ELSE 'Cannot access messages ❌ - Check RLS policies'
  END as status;

-- 8. Check Supabase realtime service status
-- NOTE: Realtime is NOT a PostgreSQL extension - it's a Supabase service
-- The "extension not loaded" message is misleading - ignore it!
-- What matters is if the table is published (check #2 above)
SELECT
  'Realtime Service' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
    )
    THEN 'Enabled ✅ (via Dashboard)'
    ELSE 'Not Enabled ❌ - Enable via Dashboard > Database > Replication'
  END as status;