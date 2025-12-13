-- Check email verification status for users
-- Run this in your Supabase SQL Editor

-- Check specific user
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Email Confirmed ✓'
    ELSE 'Email NOT Confirmed ✗ (This is likely your issue!)'
  END as status,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'User cannot authenticate until email is confirmed'
    ELSE 'User can authenticate'
  END as auth_status
FROM auth.users
WHERE email = 'shafique@gmail.com';  -- Replace with your email

-- To fix: Manually confirm the email
-- Uncomment and run this if email_confirmed_at is NULL:
/*
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmation_token = NULL,
  confirmation_sent_at = NULL
WHERE email = 'shafique@gmail.com'  -- Replace with your email
  AND email_confirmed_at IS NULL;
*/

-- Check all users
SELECT 
  email,
  email_confirmed_at IS NOT NULL as is_confirmed,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
