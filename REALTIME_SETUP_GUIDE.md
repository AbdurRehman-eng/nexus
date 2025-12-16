# Complete Realtime Setup Guide

## ⚠️ IMPORTANT: Realtime is NOT a PostgreSQL Extension

The error "extension 'realtime' is not available" is **normal**. Realtime in Supabase is **not** a PostgreSQL extension that you install via SQL. It's a **service** that's built into Supabase and enabled through the Dashboard.

## Step-by-Step Setup

### Step 1: Enable Realtime via Dashboard (REQUIRED)

**This step is MANDATORY and cannot be done via SQL!**

1. Go to your **Supabase Dashboard**
2. Navigate to **Database** → **Replication**
3. Find the **"messages"** table in the list
4. **Toggle it ON** (enable realtime for this table)
5. Click **Save**

**Without this step, realtime will NOT work!**

### Step 2: Configure Table Settings (SQL)

After enabling realtime in the Dashboard, run this SQL script:

```sql
-- File: supabase/configure_realtime_correct.sql
```

Or run these commands manually:

```sql
-- Set replica identity to FULL (required for UPDATE/DELETE events)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Create realtime policy
DROP POLICY IF EXISTS "realtime_messages" ON public.messages;
CREATE POLICY "realtime_messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);
```

### Step 3: Verify Configuration

Run the verification queries from `supabase/configure_realtime_correct.sql` to check:
- ✅ Realtime Enabled: YES
- ✅ Replica Identity: FULL
- ✅ Realtime Policy: EXISTS

## Why the "Extension Not Loaded" Error?

The diagnostic script checks for a PostgreSQL extension called "realtime", but this doesn't exist in Supabase. Realtime is:
- A **service** provided by Supabase infrastructure
- Enabled per-table via the Dashboard
- Not a PostgreSQL extension

The check is misleading - ignore it if you've enabled realtime via Dashboard.

## Troubleshooting

### Messages Still Don't Appear in Realtime

1. **Verify Dashboard Configuration**:
   - Go to Database > Replication
   - Ensure "messages" table shows as **enabled** (toggle is ON)

2. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for `[Realtime]` log messages
   - Should see "✅ Successfully subscribed" when working

3. **Check Network Tab**:
   - Look for WebSocket connections (ws:// or wss://)
   - Should see connections to Supabase realtime endpoint

4. **Verify Policies**:
   - Run `supabase/configure_realtime_correct.sql`
   - All checks should show ✅

### Still Getting CHANNEL_ERROR

1. **Double-check Dashboard**:
   - Realtime must be enabled for "messages" table
   - Wait a few seconds after enabling

2. **Check RLS Policies**:
   - Ensure users can SELECT messages
   - The realtime policy should allow SELECT for authenticated users

3. **Refresh Browser**:
   - After enabling realtime, refresh the chat page
   - Check console for subscription status

## Quick Checklist

- [ ] Enabled realtime for "messages" table in Dashboard (Database > Replication)
- [ ] Set replica identity to FULL
- [ ] Created realtime policy
- [ ] Verified configuration shows all ✅
- [ ] Refreshed browser after configuration
- [ ] Checked browser console for subscription success

## Files

- `supabase/configure_realtime_correct.sql` - Correct configuration script (no extension install)
- `supabase/enable_realtime_extension.sql` - Updated (removed extension install)
- `REALTIME_SETUP_GUIDE.md` - This guide

## Summary

**The key point**: Realtime is enabled via **Dashboard**, not SQL. The SQL scripts only configure table settings. You MUST enable it in the Dashboard first!