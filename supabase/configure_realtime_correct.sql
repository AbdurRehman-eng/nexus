-- CORRECT WAY TO CONFIGURE REALTIME
-- Realtime is NOT a PostgreSQL extension - it's a Supabase service
-- You MUST enable it via the Dashboard first!

-- STEP 1: Enable Realtime via Dashboard (REQUIRED - Cannot be done via SQL)
-- Go to: Supabase Dashboard > Database > Replication
-- Find "messages" table and toggle it ON
-- Click Save
-- 
-- This step is MANDATORY - skip it and realtime won't work!

-- STEP 2: Configure table for realtime (Run this SQL script)
-- Set replica identity to FULL (required for UPDATE/DELETE events)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- STEP 3: Ensure table is published (should be done automatically by Dashboard, but verify)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'messages'
    ) THEN
        -- Try to add it (may fail if not enabled in Dashboard)
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
            RAISE NOTICE 'Added messages table to realtime publication';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add table to publication. Please enable via Dashboard > Database > Replication';
        END;
    ELSE
        RAISE NOTICE 'Messages table already in realtime publication ✅';
    END IF;
END $$;

-- STEP 4: Create realtime policy
-- This allows authenticated users to receive realtime updates
DROP POLICY IF EXISTS "realtime_messages" ON public.messages;
CREATE POLICY "realtime_messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

-- STEP 5: Verify configuration
SELECT
    'Realtime Enabled' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND schemaname = 'public'
            AND tablename = 'messages'
        )
        THEN 'YES ✅'
        ELSE 'NO ❌ - Enable via Dashboard > Database > Replication'
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

-- If "Realtime Enabled" shows NO, you MUST:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Database > Replication  
-- 3. Find "messages" table
-- 4. Toggle it ON
-- 5. Click Save
-- 6. Then run this script again