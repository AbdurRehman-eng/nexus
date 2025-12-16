# Fix "record new has no type entity" Trigger Error

## The Problem

You're getting the error: **"record new has no type entity"**

This happens when a PostgreSQL trigger function doesn't properly declare the return type or tries to use `NEW`/`OLD` incorrectly.

---

## Important: You Don't Need Triggers for Realtime! ✅

**Supabase Realtime does NOT use triggers.** It uses PostgreSQL's built-in logical replication (WAL).

If you created a trigger thinking it was needed for realtime, you can safely remove it.

---

## Solution: Remove the Trigger

### Step 1: Run the Fix Script

Run this SQL in Supabase SQL Editor:

```sql
-- Remove all triggers on messages table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'messages'
        AND event_object_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.messages CASCADE', trigger_record.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- Remove trigger functions
DROP FUNCTION IF EXISTS public.handle_message_insert() CASCADE;
DROP FUNCTION IF EXISTS public.handle_message_update() CASCADE;
DROP FUNCTION IF EXISTS public.notify_message_change() CASCADE;
```

Or use the complete script: `supabase/fix_or_remove_messages_trigger.sql`

### Step 2: Verify Realtime Still Works

After removing the trigger, realtime should still work because:
- Realtime uses PostgreSQL WAL (Write-Ahead Log)
- No triggers are involved
- It's automatic once configured

---

## If You Really Need a Trigger (For Other Purposes)

If you need a trigger for something OTHER than realtime (like logging, validation, etc.), here's the correct syntax:

### Correct Trigger Function Syntax

```sql
-- Correct way to create a trigger function
CREATE OR REPLACE FUNCTION public.handle_message_insert()
RETURNS TRIGGER  -- Must return TRIGGER type
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- NEW is automatically available - don't declare it
    -- You can access: NEW.id, NEW.content, NEW.channel_id, etc.
    
    -- Your logic here
    -- Example: INSERT INTO logs (message_id) VALUES (NEW.id);
    
    RETURN NEW; -- Must return NEW for INSERT/UPDATE
END;
$$;

-- Create the trigger
CREATE TRIGGER on_message_insert
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_message_insert();
```

### Common Mistakes That Cause the Error

❌ **Wrong:**
```sql
CREATE FUNCTION my_trigger()
RETURNS void  -- Wrong return type!
AS $$
DECLARE
    new_record RECORD;  -- Don't declare NEW!
BEGIN
    -- ...
END;
$$;
```

✅ **Correct:**
```sql
CREATE FUNCTION my_trigger()
RETURNS TRIGGER  -- Must be TRIGGER
AS $$
BEGIN
    -- NEW is automatically available, no declaration needed
    -- Use NEW.id, NEW.content, etc. directly
    RETURN NEW;
END;
$$;
```

---

## Verify Your Setup

After removing the trigger, verify realtime is still configured:

```sql
-- Check if realtime is published
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND tablename = 'messages'
        ) THEN '✅ Realtime Published'
        ELSE '❌ Not Published - Enable in Dashboard'
    END as status;

-- Check replica identity
SELECT 
    CASE relreplident
        WHEN 'f' THEN '✅ FULL'
        ELSE '❌ Not FULL'
    END as replica_identity
FROM pg_class
WHERE relname = 'messages';
```

---

## Summary

1. **Remove the trigger** - It's not needed for realtime
2. **Realtime will still work** - It uses WAL, not triggers
3. **If you need a trigger** - Use `RETURNS TRIGGER` and don't declare `NEW`
4. **Test sending messages** - Should work without the trigger error

The error will go away once you remove the incorrectly configured trigger!
