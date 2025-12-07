-- SQL to help with email verification issues
-- Note: Supabase email confirmation settings are managed in the Dashboard
-- This SQL will mark existing users as confirmed so they can sign in

-- Option 1: Mark all existing users as email confirmed
-- This allows existing users to sign in without email verification
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, created_at)
WHERE email_confirmed_at IS NULL;

-- Option 2: Mark specific user as confirmed (replace with actual user email)
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email = 'user@example.com' AND email_confirmed_at IS NULL;

-- Verify the update
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Not Confirmed'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- IMPORTANT: To fully disable email verification for NEW users:
-- You MUST go to Supabase Dashboard:
-- 1. Go to Authentication → Settings
-- 2. Find "Email Auth" section
-- 3. Disable "Confirm email" or "Enable email confirmations"
-- 4. Save changes
--
-- This SQL only helps existing users. New users will still need
-- email confirmation unless you disable it in the dashboard.
