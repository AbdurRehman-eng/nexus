-- Alternative Fix: Disable and Re-enable RLS with Correct Policies
-- Use this if the previous fix doesn't work

-- Step 1: Temporarily disable RLS
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can update contact messages" ON public.contact_messages;

-- Step 3: Re-enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Step 4: Create INSERT policy for anonymous users (most permissive)
CREATE POLICY "Allow anonymous inserts"
  ON public.contact_messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Step 5: Create INSERT policy for authenticated users
CREATE POLICY "Allow authenticated inserts"
  ON public.contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 6: Create SELECT policy for authenticated users
CREATE POLICY "Authenticated users can view contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 7: Create UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify: Check that policies exist
SELECT 
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'contact_messages'
ORDER BY policyname;
