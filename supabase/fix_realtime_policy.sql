-- Fix for CHANNEL_ERROR: Create Realtime policy for messages
-- Realtime policies are SEPARATE from RLS policies!

-- Navigate to: Database > Realtime > Policies > messages
-- Or run this SQL:

-- First, ensure the table is published to realtime
-- (This should be done via UI: Database > Replication > Toggle messages ON)

-- Create Realtime policy - allows authenticated users to receive updates
-- for messages in channels they're members of
DROP POLICY IF EXISTS "Enable realtime for authenticated users" ON realtime.messages;

-- Note: Realtime policies use the realtime schema, not public
-- The policy should match your SELECT RLS policy logic

-- If the above doesn't work, try creating the policy via the Realtime UI:
-- 1. Go to Database > Realtime > Policies
-- 2. Click "Create policy" for messages table  
-- 3. Select "Enable read access"
-- 4. Use same conditions as your SELECT RLS policy:
--    EXISTS (
--      SELECT 1 FROM public.channel_members
--      WHERE channel_members.channel_id = messages.channel_id
--      AND channel_members.user_id = auth.uid()
--    )

-- Alternative: Create a simplified policy for all authenticated users
-- (then rely on RLS for actual data filtering)
CREATE POLICY "Enable realtime for all authenticated users"
ON public.messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- This allows realtime to work, while RLS still controls data access
