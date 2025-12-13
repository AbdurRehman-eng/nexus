# Cookie Debugging Instructions

## The Problem

The client-side login was succeeding, but server actions were seeing "Not authenticated". This happens when:
1. Client sets session in localStorage (default for createBrowserClient)
2. Server can't read localStorage - it needs cookies
3. Server actions return "Not authenticated" even though client is logged in

## The Fix

Updated `src/lib/supabase/client.ts` to explicitly configure cookie handlers so that:
- Client-side auth sets **cookies** (not just localStorage)
- Cookies are set with correct flags: `path=/`, `SameSite=Lax`
- Server can read these cookies in server actions

## Testing the Fix

### 1. Clear Everything First

```javascript
// In browser console (F12)
// Clear all cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// Clear localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();
```

Then **hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R).

### 2. Login Again

1. Go to `/login`
2. Enter credentials
3. Open DevTools Console (F12)
4. Click "Sign In"

### 3. Check Console Logs

You should see:

```
[Login] ===== LOGIN ATTEMPT START =====
[Login] Email: your-email@example.com
[Login] Calling signInWithPassword...
[Login] Login successful: {userId: '...', email: '...', expiresAt: ...}
[Login] Session verification: {hasSession: true, userId: '...'}
[Login] Cookies in document.cookie: {
  hasCookies: true,
  cookieCount: 3+,
  supabaseCookies: ['sb-xxxx-auth-token', ...]
}
[Login] ===== LOGIN SUCCESS - REDIRECTING =====
```

**Key indicator**: `supabaseCookies` should include `sb-{projectRef}-auth-token`

### 4. Check Application Tab

1. Open DevTools → Application tab
2. Navigate to Cookies → http://localhost:3000
3. Look for cookies with names like:
   - `sb-{projectRef}-auth-token`
   - `sb-{projectRef}-auth-token-code-verifier`

**Important properties**:
- ✅ Path: `/`
- ✅ SameSite: `Lax`
- ✅ Expires: Should be in the future (1 hour+)

### 5. Check Server Action

After redirect to `/homepage`, check console:

```
[Homepage] ===== LOAD WORKSPACES START =====
[Homepage] Client session check: {hasSession: true, userId: '...'}
[Homepage] Calling getWorkspaces server action...
```

Then check **server console** (terminal running npm run dev):

```
[getWorkspaces] ===== GET WORKSPACES START =====
[getWorkspaces] Available cookies: {
  total: 5+,
  supabaseCookies: [
    {name: 'sb-xxxx-auth-token', hasValue: true, valueLength: 2000+}
  ]
}
[getWorkspaces] Claims check: {
  hasClaims: true,           ← SHOULD BE TRUE NOW!
  userId: '...',
  email: '...'
}
```

**Key indicator**: `hasClaims: true` (was `false` before)

### 6. Verify Homepage Loads

If everything works:
- ✅ No redirect back to login
- ✅ Workspaces display (or "create workspace" message)
- ✅ Client logs show `hasError: false`

```
[Homepage] getWorkspaces result: {
  hasError: false,          ← SHOULD BE FALSE!
  error: undefined,
  workspacesCount: 0+
}
```

## Common Issues

### Issue 1: Still seeing "Not authenticated"

**Check**: Are cookies being set?
```javascript
// In browser console
console.log(document.cookie)
// Should include 'sb-' cookies
```

**Solution**: 
- Clear all cookies and try again
- Restart dev server
- Make sure you're using the updated `client.ts` file

### Issue 2: Cookies set but not sent to server

**Check**: Cookie path and SameSite
- Path must be `/` (not restricted to specific path)
- SameSite should be `Lax` for localhost

**Solution**: The updated `client.ts` sets these correctly. Clear cookies and login again.

### Issue 3: "Invalid JWT" or claims validation fails

**Possible causes**:
1. Email verification required but not completed
2. Clock skew between client and server
3. Expired JWT

**Solution for email verification**:
Check Supabase dashboard:
1. Go to Authentication → Settings
2. Ensure "Confirm email" is OFF (or user's email is verified)
3. Or manually verify the user in Authentication → Users

**Check email verification status**:
```sql
-- Run in Supabase SQL Editor
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'your-email@example.com';
```

If `email_confirmed_at` is NULL and email confirmation is enabled, that's your problem.

**To disable email confirmation**:
1. Supabase Dashboard → Authentication → Settings
2. Scroll to "Email Auth"
3. Turn OFF "Confirm email"
4. Save

**To manually verify a user**:
```sql
-- Run in Supabase SQL Editor
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmation_token = NULL
WHERE email = 'your-email@example.com'
  AND email_confirmed_at IS NULL;
```

## Success Criteria

All of these should be true:

- ✅ Login succeeds (client-side)
- ✅ Cookies are set in browser (check Application tab)
- ✅ Cookies include `sb-{projectRef}-auth-token`
- ✅ Homepage loads without redirect
- ✅ Server action `getWorkspaces` returns `hasClaims: true`
- ✅ Server logs show cookies are present
- ✅ No "Not authenticated" errors

## Additional Debugging

### Enable verbose cookie logging

In `src/lib/supabase/client.ts`, you can temporarily add logs:

```typescript
set(name: string, value: string, options: any) {
  console.log('[Supabase Client] Setting cookie:', {
    name,
    valueLength: value.length,
    path: options?.path || '/',
    sameSite: options?.sameSite || 'Lax',
  });
  
  // ... existing code
}
```

### Check middleware

Middleware logs should show successful auth:

```
[Middleware] getClaims result: {
  hasClaims: true,
  userId: '...',
  cookieCount: 5+,
  cookieNames: ['sb-...', ...]
}
```

If middleware shows `hasClaims: false`, cookies aren't being sent with page requests.

## Technical Details

### Why This Fix Works

**Before**: 
- `createBrowserClient()` used default storage (localStorage)
- localStorage is not sent with HTTP requests
- Server actions couldn't access session data

**After**:
- `createBrowserClient()` explicitly configured to use cookies
- Cookies are set with correct flags for SSR
- Server actions receive cookies in request headers
- `getClaims()` can validate JWT from cookies

### Cookie Configuration

The critical parts of the cookie configuration:

```typescript
{
  cookies: {
    set(name, value, options) {
      // Must set path=/ so ALL routes can read it
      cookie += `; path=/`
      
      // Must set SameSite=Lax for cross-origin requests
      cookie += `; SameSite=Lax`
      
      // Secure in production only
      if (window.location.protocol === 'https:') {
        cookie += '; Secure'
      }
    }
  }
}
```

Without this configuration, Supabase SSR won't work correctly.
