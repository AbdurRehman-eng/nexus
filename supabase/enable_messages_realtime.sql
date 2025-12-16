-- Check REPLICA IDENTITY for messages table by schema
SELECT 
  n.nspname AS schema_name,
  c.relname AS table_name,
  CASE c.relreplident
    WHEN 'd' THEN 'DEFAULT (primary key only)'
    WHEN 'f' THEN 'FULL (all columns)'
    WHEN 'i' THEN 'INDEX'
    WHEN 'n' THEN 'NOTHING'
  END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'messages'
ORDER BY n.nspname;

-- If public.messages shows DEFAULT, run this to fix it:
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Verify it worked:
SELECT 
  n.nspname AS schema_name,
  c.relname AS table_name,
  CASE c.relreplident
    WHEN 'd' THEN 'DEFAULT'
    WHEN 'f' THEN 'FULL'
  END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'messages' AND n.nspname = 'public';
-- Should return: public | messages | FULL
