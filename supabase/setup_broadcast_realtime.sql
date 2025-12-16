-- Setup Broadcast Realtime for Messages Table
-- This replaces Postgres Changes (WAL) with Broadcast method
-- Run this in Supabase SQL Editor

-- Step 1: Create broadcast authorization policy
-- This allows authenticated users to receive broadcasts
-- Note: The realtime.messages table is managed by Supabase
-- If the policy creation fails, it may already exist or the table structure is different
DO $$
BEGIN
  -- Try to create the policy (may fail if table doesn't exist or policy already exists)
  BEGIN
    DROP POLICY IF EXISTS "Authenticated users can receive broadcasts" ON "realtime"."messages";
    CREATE POLICY "Authenticated users can receive broadcasts"
    ON "realtime"."messages"
    FOR SELECT
    TO authenticated
    USING ( true );
    RAISE NOTICE 'Broadcast policy created successfully';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Broadcast policy creation skipped (may already exist or table structure different): %', SQLERRM;
  END;
END $$;

-- Step 2: Create trigger function that broadcasts changes
-- This function will be called whenever a message is inserted, updated, or deleted
CREATE OR REPLACE FUNCTION public.messages_changes()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Broadcast the change to a topic named after the channel_id
  -- This allows clients to subscribe to specific channels
  PERFORM realtime.broadcast_changes(
    'channel:' || COALESCE(NEW.channel_id, OLD.channel_id)::text,  -- topic: channel:<channel_id>
    TG_OP,                                                          -- event: INSERT, UPDATE, or DELETE
    TG_OP,                                                          -- operation: same as event
    TG_TABLE_NAME,                                                  -- table: 'messages'
    TG_TABLE_SCHEMA,                                                -- schema: 'public'
    NEW,                                                            -- new record (for INSERT/UPDATE)
    OLD                                                             -- old record (for UPDATE/DELETE)
  );
  RETURN NULL;
END;
$$;

-- Step 3: Create trigger on messages table
-- This trigger fires after INSERT, UPDATE, or DELETE
DROP TRIGGER IF EXISTS handle_messages_changes ON public.messages;
CREATE TRIGGER handle_messages_changes
AFTER INSERT OR UPDATE OR DELETE
ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.messages_changes();

-- Step 4: Verify setup
SELECT 
    'Trigger Function' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.proname = 'messages_changes'
        ) THEN '✅ Created'
        ELSE '❌ Not found'
    END as status
UNION ALL
SELECT
    'Trigger' as check_type,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers
            WHERE event_object_table = 'messages'
            AND event_object_schema = 'public'
            AND trigger_name = 'handle_messages_changes'
        ) THEN '✅ Created'
        ELSE '❌ Not found'
    END as status
UNION ALL
SELECT
    'Broadcast Policy' as check_type,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'realtime'
            AND tablename = 'messages'
            AND policyname = 'Authenticated users can receive broadcasts'
        ) THEN '✅ Created'
        ELSE '❌ Not found'
    END as status;

-- IMPORTANT NOTES:
-- ============================================
-- 1. This uses Broadcast method (requires triggers)
-- 2. Clients will subscribe to topic: 'channel:<channel_id>'
-- 3. The trigger broadcasts INSERT, UPDATE, and DELETE events
-- 4. Make sure to remove any old Postgres Changes subscriptions in your code
-- 5. The client code needs to use private channels with broadcast listeners
