-- DEBUG: Force Open Realtime Access
-- Run this to temporarily allow ALL realtime access to rule out policy issues

-- 1. Drop existing policies that might be broken
DROP POLICY IF EXISTS "Enable realtime for authenticated users" ON realtime.messages;
DROP POLICY IF EXISTS "Enable realtime for channel members" ON realtime.messages;

-- 2. Create a "Permissive" Realtime Policy
-- This allows ANY authenticated user to listen to ANY message change
-- (We will restrict this later, but we need to see if it works first)
CREATE POLICY "Debug: Allow All Realtime"
ON public.messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Verify Publication
-- Ensure the table is actually in the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 4. Verify Replica Identity (Again)
ALTER TABLE public.messages REPLICA IDENTITY FULL;
