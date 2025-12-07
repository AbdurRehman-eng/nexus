-- Fix RLS Policy for contact_messages table
-- Run this SQL in your Supabase SQL Editor to fix the contact form insert issue

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

-- Create a new policy that explicitly allows anonymous and authenticated users to insert
-- This policy allows both anonymous (anon) and authenticated users to insert contact messages
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Verify the policy was created
-- You can check by running: SELECT * FROM pg_policies WHERE tablename = 'contact_messages';
