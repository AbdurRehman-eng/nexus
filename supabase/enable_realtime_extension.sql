-- CONFIGURE REALTIME FOR MESSAGES TABLE
-- IMPORTANT: Realtime is NOT a PostgreSQL extension - it's a Supabase service
-- You must enable it via Dashboard: Database > Replication > Toggle "messages" table ON
-- This script only configures the table settings needed for realtime to work

-- NOTE: The "realtime extension" check in diagnostics is misleading.
-- Realtime is always available in Supabase - you just need to:
-- 1. Enable it for your table via Dashboard (Database > Replication)
-- 2. Configure the table properly (this script does that)

-- Step 1: Ensure messages table is published to realtime
-- IMPORTANT: If this fails, enable via Dashboard: Database > Replication > Toggle "messages" ON
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

-- Step 2: Set replica identity to FULL (required for UPDATE/DELETE events)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Step 3: Create/update realtime policy
-- This policy allows authenticated users to receive realtime updates
DROP POLICY IF EXISTS "realtime_messages" ON public.messages;
CREATE POLICY "realtime_messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

-- Step 4: Verify realtime configuration
SELECT
    'Realtime Service' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND schemaname = 'public'
            AND tablename = 'messages'
        )
        THEN 'ENABLED ✅ (via Dashboard)'
        ELSE 'NOT ENABLED ❌ - Enable via Dashboard > Database > Replication'
    END as status
UNION ALL
SELECT
    'Messages Published' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND schemaname = 'public'
            AND tablename = 'messages'
        )
        THEN 'YES ✅'
        ELSE 'NO ❌'
    END as status
UNION ALL
SELECT
    'Replica Identity' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_class c
            WHERE c.relname = 'messages'
            AND c.relnamespace = 'public'::regnamespace
            AND c.relreplident = 'f'
        )
        THEN 'FULL ✅'
        ELSE 'NOT FULL ❌'
    END as status
UNION ALL
SELECT
    'Realtime Policy' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public'
            AND tablename = 'messages'
            AND policyname = 'realtime_messages'
        )
        THEN 'EXISTS ✅'
        ELSE 'MISSING ❌'
    END as status;

-- IMPORTANT INSTRUCTIONS:
-- 
-- 1. Go to Supabase Dashboard > Database > Replication
-- 2. Find the "messages" table in the list
-- 3. Toggle it ON (enable realtime for this table)
-- 4. Click Save
--
-- This is REQUIRED - realtime cannot work without this step!
-- The SQL script above only configures the table settings.
-- You MUST enable realtime via the Dashboard for it to work.
--
-- After enabling in Dashboard, run this script again to verify everything is configured correctly.