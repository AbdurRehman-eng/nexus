# How Supabase Realtime Works for Chat Messages

## Important: No Triggers Needed! ✅

Supabase Realtime **does NOT use database triggers**. It uses PostgreSQL's built-in **logical replication** feature (also called WAL - Write-Ahead Log).

---

## How It Actually Works

### 1. **PostgreSQL Logical Replication (WAL)**

When you insert/update/delete a row in the `messages` table:
- PostgreSQL writes the change to the **Write-Ahead Log (WAL)**
- Supabase's realtime service reads from this WAL
- Changes are streamed to connected clients via WebSockets

**No triggers involved** - it's all automatic once configured!

---

## What You Need to Configure

### Step 1: Enable Realtime in Dashboard (REQUIRED)

1. Go to **Supabase Dashboard** → **Database** → **Replication**
2. Find the **"messages"** table
3. **Toggle it ON** ✅
4. Click **Save**

**This is MANDATORY** - realtime won't work without this step!

### Step 2: Run SQL Configuration

Run this SQL script in Supabase SQL Editor:

```sql
-- Set replica identity to FULL (required for UPDATE/DELETE events)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Create realtime policy (allows authenticated users to receive updates)
DROP POLICY IF EXISTS "realtime_messages" ON public.messages;
CREATE POLICY "realtime_messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

-- Verify configuration
SELECT
  'Realtime Published' as check_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
    ) THEN 'YES ✅'
    ELSE 'NO ❌ - Enable in Dashboard > Database > Replication'
  END as status
UNION ALL
SELECT
  'Replica Identity' as check_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_class c
      WHERE c.relname = 'messages'
      AND c.relnamespace = 'public'::regnamespace
      AND c.relreplident = 'f'
    ) THEN 'FULL ✅'
    ELSE 'NOT FULL ❌'
  END as status;
```

---

## How Messages Flow

```
User A sends message
    ↓
Server inserts row into messages table
    ↓
PostgreSQL writes to WAL (automatic)
    ↓
Supabase Realtime reads from WAL
    ↓
WebSocket sends event to subscribed clients
    ↓
User B's browser receives event
    ↓
React state updates
    ↓
Message appears in chat UI ✅
```

---

## Key Points

1. **No Triggers**: Realtime uses PostgreSQL's built-in replication, not triggers
2. **WAL-Based**: Changes are read from PostgreSQL's Write-Ahead Log
3. **Automatic**: Once configured, it works automatically for all INSERT/UPDATE/DELETE
4. **Dashboard Required**: Must enable in Dashboard → Database → Replication
5. **RLS Still Applies**: Row Level Security policies still control who can see what

---

## Troubleshooting

### Realtime Not Working?

1. **Check Dashboard**: Go to Database → Replication → Is "messages" table enabled?
2. **Check Publication**: Run the verification query above
3. **Check Replica Identity**: Must be `FULL` for UPDATE/DELETE events
4. **Check RLS Policy**: Must have a SELECT policy for authenticated users
5. **Check Browser Console**: Look for `[Realtime]` logs

### Common Issues

**"mismatch between server and client bindings"**
- Don't mix `broadcast`/`presence` with `postgres_changes` in the same channel
- Use only `postgres_changes` for database events

**"No events received"**
- Verify table is enabled in Dashboard → Replication
- Check that RLS policies allow SELECT for authenticated users
- Ensure `REPLICA IDENTITY FULL` is set

**"Events received but messages don't appear"**
- Check channel ID matches (message's `channel_id` must match subscription filter)
- Check browser console for formatting errors
- Verify React state is updating correctly

---

## Verification Query

Run this to check your realtime setup:

```sql
-- Check if messages table is published
SELECT 
  'messages' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
    ) THEN 'Published ✅'
    ELSE 'NOT Published ❌'
  END as status;

-- Check replica identity
SELECT 
  relname as table_name,
  CASE relreplident
    WHEN 'f' THEN 'FULL ✅'
    WHEN 'd' THEN 'DEFAULT (may not work for UPDATE/DELETE)'
    ELSE 'UNKNOWN'
  END as replica_identity
FROM pg_class
WHERE relname = 'messages'
AND relnamespace = 'public'::regnamespace;
```

---

## Summary

- ✅ **No triggers needed** - uses PostgreSQL logical replication
- ✅ **Enable in Dashboard** - Database → Replication → Toggle ON
- ✅ **Set REPLICA IDENTITY FULL** - Required for UPDATE/DELETE events
- ✅ **Create RLS policy** - Allows authenticated users to receive updates
- ✅ **Automatic** - Works for all INSERT/UPDATE/DELETE once configured

The realtime service reads from PostgreSQL's WAL and streams changes to your clients automatically!
