# Debug Authentication Issue - Step by Step

## Current Situation

Your logs show:
- ✅ Cookies ARE being set correctly
- ✅ Cookies ARE being sent to the server
- ❌ But `getClaims()` returns `false` - JWT validation failing

This typically means **EMAIL IS NOT VERIFIED** or there's a JWT validation issue.

## Step 1: Clear ALL Cookies and Restart

You have cookies from TWO different Supabase projects. Clean them all:

### In Browser Console (F12):

```javascript
// Clear ALL cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// Clear storage
localStorage.clear();
sessionStorage.clear();

// Verify cookies are gone
console.log('Cookies:', document.cookie);  // Should be empty or minimal
```

### Restart Dev Server:

```bash
# Stop server (Ctrl+C)
npm run dev
```

## Step 2: Check Email Verification Status

### Option A: Via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Find the user `shafique@gmail.com`
4. Check the "Email Confirmed" column
   - If it says "Not confirmed" or has no date, **THIS IS YOUR PROBLEM**

### Option B: Via SQL Editor

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query:

```sql
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'NOT CONFIRMED - This is the problem!'
  END as status
FROM auth.users
WHERE email = 'shafique@gmail.com';
```

## Step 3: Fix Email Verification

If email is NOT confirmed, you have two options:

### Option A: Disable Email Confirmation (Easiest for Development)

1. Supabase Dashboard → **Authentication** → **Providers**
2. Click on **Email** provider
3. Look for "Confirm email" setting
4. **Turn it OFF**
5. Click Save

Then manually confirm existing users:

```sql
-- Run in SQL Editor
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmation_token = NULL
WHERE email = 'shafique@gmail.com'
  AND email_confirmed_at IS NULL;
```

### Option B: Verify Email via Link (Production Way)

1. User receives confirmation email
2. Clicks the link in email
3. Email gets confirmed
4. User can then sign in

## Step 4: Test Again

After fixing email verification:

1. **Clear cookies again** (important!)
2. **Restart dev server**
3. Go to `/login`
4. Sign in with credentials
5. Check **server console** (terminal) for:

```
[Middleware] Auth validation: {
  hasUser: true,           ← Should be TRUE now
  userId: '...',
  userEmail: '...',
  emailConfirmed: '2024-...',  ← Should have a date
}

[getWorkspaces] User check (via getUser): {
  hasUser: true,           ← Should be TRUE now
  userId: '...',
  email: '...',
  emailConfirmed: '2024-...'   ← Should have a date
}
```

## Step 5: Check for Other Issues

If email IS confirmed but still not working:

### Check Environment Variables

Verify your `.env.local` has correct values:

```bash
# In terminal
Get-Content .env.local | Select-String "SUPABASE"
```

Should show:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Check Project Mismatch

Your logs show TWO project refs:
- `sb-lrqwusychtazuirzsebt-*`
- `sb-jpygbewyjbpphydcjnoy-*`

Make sure your code is using the SAME project as the cookies.

1. Check your Supabase URL:
   ```bash
   echo $env:NEXT_PUBLIC_SUPABASE_URL
   ```

2. Extract project ref from URL:
   - URL: `https://jpygbewyjbpphydcjnoy.supabase.co`
   - Project ref: `jpygbewyjbpphydcjnoy`

3. Check cookies match this project ref

### Verify JWT is Valid

In browser console after login:

```javascript
const supabase = createClient();
const { data } = await supabase.auth.getSession();
console.log('Session:', {
  hasSession: !!data.session,
  expiresAt: new Date(data.session?.expires_at * 1000),
  isExpired: data.session?.expires_at * 1000 < Date.now()
});
```

## Most Likely Solution

Based on your logs, I'm 90% confident the issue is:

**❌ Email is not confirmed in Supabase**

To fix:
1. Run the SQL query in Step 2 to check
2. Run the UPDATE query in Step 3 Option A to confirm email
3. OR turn off email confirmation in dashboard

Then clear cookies and test again.

## What Changed

I updated the code to use `getUser()` instead of `getClaims()` because:
- `getUser()` makes an actual API call to validate the session
- `getClaims()` only checks JWT locally
- `getUser()` will show more detailed error messages

The new logging will tell us EXACTLY what's wrong.

## Next Steps

1. **Clear ALL cookies** (Step 1)
2. **Check email verification** (Step 2)
3. **Fix if needed** (Step 3)
4. **Test login** (Step 4)
5. Share the new server console logs with me

The new logs will show `emailConfirmed` and `userError` which will tell us exactly what's failing.
