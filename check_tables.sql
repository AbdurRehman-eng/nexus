-- Quick check if reminders table exists
-- Run this in your Supabase SQL editor to check if the reminders table exists:

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('reminders', 'direct_messages');

-- If no results, you need to run the migration from QUICK_START.md
-- If you see the tables, check if there are any specific error messages in your browser console