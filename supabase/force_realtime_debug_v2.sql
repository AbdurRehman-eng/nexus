-- DEBUG: Force Open Realtime Access (Fixed)
-- We removed the step that caused the error since Realtime is already enabled!

-- 1. Drop existing policies that might be broken
DROP POLICY IF EXISTS "Enable realtime for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable realtime for channel members" ON public.messages;
DROP POLICY IF EXISTS "Debug: Allow All Realtime" ON public.messages;

-- 2. Create a "Permissive" Realtime Policy
-- This allows ANY authenticated user to listen to ANY message change
CREATE POLICY "Debug: Allow All Realtime"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

-- 3. Verify Replica Identity (Crucial for UPDATE/DELETE events)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 4. Verify it worked
SELECT 
  tablename, 
  policyname,
  cmd 
FROM pg_policies 
WHERE tablename = 'messages' 
AND policyname = 'Debug: Allow All Realtime';
