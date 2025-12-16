# Switching to Broadcast Realtime Method

## Overview

You're switching from **Postgres Changes (WAL)** to **Broadcast** method because WAL wasn't working reliably. Broadcast uses triggers and is more reliable for real-time messaging.

---

## Step 1: Run SQL Setup Script

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `supabase/setup_broadcast_realtime.sql`
3. Click **Run** to execute
4. Verify all checks show ✅

This script will:
- ✅ Create broadcast authorization policy
- ✅ Create trigger function `messages_changes()`
- ✅ Create trigger `handle_messages_changes` on messages table

---

## Step 2: Verify Setup

After running the SQL, check:

```sql
-- Check trigger function exists
SELECT proname FROM pg_proc 
WHERE proname = 'messages_changes';

-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'messages' 
AND trigger_name = 'handle_messages_changes';

-- Check broadcast policy exists
SELECT policyname FROM pg_policies 
WHERE schemaname = 'realtime' 
AND tablename = 'messages';
```

All should return results.

---

## Step 3: Code Changes (Already Done)

The client code has been updated to:
- ✅ Use `broadcast` listeners instead of `postgres_changes`
- ✅ Subscribe to topic `channel:<channelId>`
- ✅ Use private channels with `config: { private: true }`
- ✅ Call `supabase.realtime.setAuth()` before subscribing

---

## How It Works Now

### Before (Postgres Changes - WAL):
```
Message Insert → PostgreSQL WAL → Supabase Realtime → Client
(No triggers needed)
```

### After (Broadcast):
```
Message Insert → Trigger fires → realtime.broadcast_changes() → Client
(Trigger required)
```

### Topic Format:
- **Topic:** `channel:<channelId>`
- **Example:** `channel:abc123` for channel with ID `abc123`

### Events Broadcast:
- `INSERT` - New messages
- `UPDATE` - Edited messages  
- `DELETE` - Deleted messages

---

## Testing

1. **Open chat in two browser windows** (or two users)
2. **Send a message from User A**
3. **Check User B's console** - should see:
   ```
   [Realtime] 🔔 BROADCAST INSERT event callback triggered!
   [Realtime] ✅ Message formatted successfully
   [Realtime] ✅ Adding new message to state!
   ```
4. **Message should appear immediately** in User B's chat

---

## Troubleshooting

### Messages Not Appearing?

1. **Check trigger exists:**
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE event_object_table = 'messages';
   ```

2. **Check trigger function:**
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'messages_changes';
   ```

3. **Test trigger manually:**
   ```sql
   -- Insert a test message and check if trigger fires
   INSERT INTO messages (channel_id, sender_id, content) 
   VALUES ('test-channel', 'test-user', 'test');
   ```

4. **Check browser console** for:
   - `[Realtime] ✅✅✅ Successfully subscribed to Broadcast channel`
   - `[Realtime] 🔔 BROADCAST INSERT event callback triggered!`

### "Channel error" or "Not subscribed"?

1. **Verify broadcast policy:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'realtime' AND tablename = 'messages';
   ```

2. **Check session/auth token:**
   - Console should show: `[Realtime] Setting auth for Broadcast`
   - User must be authenticated

3. **Verify trigger function syntax:**
   - Run `setup_broadcast_realtime.sql` again
   - Check for any SQL errors

---

## Differences from Postgres Changes

| Feature | Postgres Changes | Broadcast |
|---------|------------------|-----------|
| **Triggers** | ❌ Not needed | ✅ Required |
| **Setup** | Dashboard + SQL | SQL only |
| **Scalability** | Good | Better |
| **Reliability** | Depends on WAL | More reliable |
| **Channel Type** | Public | Private |
| **Auth** | Automatic | `setAuth()` required |

---

## Reverting to Postgres Changes

If you want to go back:

1. **Remove trigger:**
   ```sql
   DROP TRIGGER IF EXISTS handle_messages_changes ON public.messages;
   DROP FUNCTION IF EXISTS public.messages_changes();
   ```

2. **Revert code changes** in `src/app/chat/[id]/page.tsx`:
   - Change `broadcast` back to `postgres_changes`
   - Remove `private: true` config
   - Remove `supabase.realtime.setAuth()` call
   - Change topic from `channel:${channelId}` to `messages:${channelId}`

---

## Next Steps

1. ✅ Run `setup_broadcast_realtime.sql`
2. ✅ Test with two users
3. ✅ Verify messages appear in real-time
4. ✅ Check console logs for any errors

If issues persist, check the troubleshooting section above.
