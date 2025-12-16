-- Remove Trigger from Messages Table
-- 
-- Your codebase uses Postgres Changes (not Broadcast), so triggers are NOT needed.
-- This script removes any triggers you may have created.

-- Step 1: Drop all triggers on messages table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'messages'
        AND event_object_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.messages CASCADE', trigger_record.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No triggers found on messages table';
    END IF;
END $$;

-- Step 2: Drop common trigger function names
DROP FUNCTION IF EXISTS public.handle_message_insert() CASCADE;
DROP FUNCTION IF EXISTS public.handle_message_update() CASCADE;
DROP FUNCTION IF EXISTS public.handle_message_delete() CASCADE;
DROP FUNCTION IF EXISTS public.notify_message_change() CASCADE;
DROP FUNCTION IF EXISTS public.messages_changes() CASCADE;
DROP FUNCTION IF EXISTS public.your_table_changes() CASCADE;

-- Step 3: Verify triggers are removed
SELECT 
    'Triggers Remaining' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All triggers removed'
        ELSE '⚠️ ' || COUNT(*) || ' trigger(s) still exist'
    END as status
FROM information_schema.triggers 
WHERE event_object_table = 'messages'
AND event_object_schema = 'public';

-- Step 4: Verify Postgres Changes setup (what you're actually using)
SELECT
    'Postgres Changes Setup' as check_type,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND schemaname = 'public'
            AND tablename = 'messages'
        ) THEN '✅ Configured - Postgres Changes will work'
        ELSE '❌ Not configured - Enable in Dashboard > Database > Replication'
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
        ) THEN '✅ FULL - UPDATE/DELETE will work'
        ELSE '❌ Not FULL - Run: ALTER TABLE public.messages REPLICA IDENTITY FULL;'
    END as status;

-- IMPORTANT NOTES:
-- ============================================
-- 1. Your code uses Postgres Changes (simpler method)
-- 2. Postgres Changes does NOT require triggers
-- 3. After removing triggers, realtime will still work
-- 4. The error "record new has no type entity" will be fixed
-- 5. Messages will send and appear in real-time without triggers
