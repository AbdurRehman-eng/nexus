-- Fix or Remove Messages Table Trigger
-- 
-- IMPORTANT: Supabase Realtime does NOT require triggers!
-- Realtime uses PostgreSQL logical replication (WAL), not triggers.
-- 
-- If you created a trigger and it's causing errors, you can either:
-- 1. Fix it (if you need it for other purposes)
-- 2. Remove it (recommended - not needed for realtime)

-- ============================================
-- OPTION 1: Remove the trigger (RECOMMENDED)
-- ============================================

-- First, find and drop any existing triggers on messages table
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
END $$;

-- Also drop any trigger functions that might be related
DROP FUNCTION IF EXISTS public.handle_message_insert() CASCADE;
DROP FUNCTION IF EXISTS public.handle_message_update() CASCADE;
DROP FUNCTION IF EXISTS public.notify_message_change() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_message_realtime() CASCADE;

-- ============================================
-- OPTION 2: Fix the trigger (if you need it)
-- ============================================
-- If you really need a trigger for some other purpose, here's the correct syntax:

/*
-- Example: Correct trigger function syntax
CREATE OR REPLACE FUNCTION public.handle_message_insert()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Your trigger logic here
    -- NEW is automatically available - no need to declare it
    -- You can access NEW.id, NEW.content, NEW.channel_id, etc.
    
    -- Example: Log the message
    -- INSERT INTO message_logs (message_id, action) VALUES (NEW.id, 'inserted');
    
    RETURN NEW; -- Must return NEW for INSERT/UPDATE triggers
END;
$$;

-- Create the trigger
CREATE TRIGGER on_message_insert
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_message_insert();
*/

-- ============================================
-- Verify triggers are removed
-- ============================================
SELECT 
    'Remaining Triggers' as check_type,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE event_object_table = 'messages'
AND event_object_schema = 'public';

-- ============================================
-- Verify Realtime is still configured correctly
-- ============================================
SELECT
    'Realtime Published' as check_type,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND schemaname = 'public'
            AND tablename = 'messages'
        ) THEN 'YES ✅ - Realtime will work without triggers'
        ELSE 'NO ❌ - Enable in Dashboard > Database > Replication'
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
        ELSE 'NOT FULL ❌'
    END as status;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. Supabase Realtime does NOT use triggers
-- 2. Realtime uses PostgreSQL logical replication (WAL)
-- 3. Removing triggers will NOT break realtime
-- 4. Realtime works automatically once enabled in Dashboard
-- 5. You only need:
--    - Realtime enabled in Dashboard > Database > Replication
--    - REPLICA IDENTITY FULL on the table
--    - RLS policy allowing SELECT for authenticated users
