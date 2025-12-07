-- Complete Fix for RLS Policy on contact_messages table
-- Run this ENTIRE block in your Supabase SQL Editor

-- Step 1: Drop all existing policies on contact_messages
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can update contact messages" ON public.contact_messages;

-- Step 2: Recreate the INSERT policy with explicit role specification
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Step 3: Recreate the SELECT policy
CREATE POLICY "Authenticated users can view contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 4: Recreate the UPDATE policy
CREATE POLICY "Authenticated users can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'contact_messages';
