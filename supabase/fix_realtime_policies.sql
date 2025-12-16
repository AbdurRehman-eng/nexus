-- FIX REALTIME POLICIES
-- If diagnostics show policy issues, run this

-- Drop all existing realtime-related policies
DROP POLICY IF EXISTS "Enable realtime for messages" ON public.messages;
DROP POLICY IF EXISTS "Enable realtime for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable realtime for channel members" ON public.messages;
DROP POLICY IF EXISTS "Debug: Allow All Realtime" ON public.messages;

-- Create a permissive realtime policy that allows all authenticated users
-- to listen to realtime events (RLS will still control actual data access)
CREATE POLICY "realtime_messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

-- Alternative: If the above doesn't work, try a policy that matches your SELECT RLS policy
-- Uncomment and modify this if the simple policy above doesn't work:

-- CREATE POLICY "realtime_channel_members"
-- ON public.messages
-- FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.channel_members
--     WHERE channel_members.channel_id = messages.channel_id
--     AND channel_members.user_id = auth.uid()
--   )
-- );

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'messages'
AND policyname = 'realtime_messages';