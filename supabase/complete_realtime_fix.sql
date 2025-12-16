-- COMPLETE REALTIME FIX
-- Run this if all other fixes fail

-- STEP 1: Ensure replica identity is FULL
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- STEP 2: Drop ALL existing policies and recreate them
DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their channels" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "Enable realtime for messages" ON public.messages;
DROP POLICY IF EXISTS "realtime_messages" ON public.messages;

-- STEP 3: Recreate RLS policies
CREATE POLICY "Users can view messages in their channels"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channel_members
    WHERE channel_members.channel_id = messages.channel_id
    AND channel_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in their channels"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.channel_members
    WHERE channel_members.channel_id = messages.channel_id
    AND channel_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- STEP 4: Create realtime policy
CREATE POLICY "realtime_messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

-- STEP 5: Verify everything is working
SELECT
  'RLS Policies' as check_name,
  COUNT(*) || ' policies exist' as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'messages'
UNION ALL
SELECT
  'Realtime Policy' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'messages'
    AND policyname = 'realtime_messages'
  ) THEN 'EXISTS ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT
  'Replica Identity' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_class c
    WHERE c.relname = 'messages'
    AND c.relnamespace = 'public'::regnamespace
    AND c.relreplident = 'f'
  ) THEN 'FULL ✅' ELSE 'NOT FULL ❌' END as status
UNION ALL
SELECT
  'Publication Status' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'messages'
  ) THEN 'ENABLED ✅' ELSE 'NOT ENABLED ❌' END as status;