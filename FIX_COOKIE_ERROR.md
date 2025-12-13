# Fix Cookie Format Error

## The Error

```
Cannot create property 'user' on string 'base64-...'
```

This error occurs because:
1. Old cookies from `@supabase/ssr@0.1.0` used a different format
2. New `@supabase/ssr@0.8.0` expects a different cookie format
3. The old format cookies are causing parse errors

## Quick Fix - Use the Auto-Clear Page

### Step 1: Visit the Clear Page

Go to: **http://localhost:3000/clear-auth**

This will automatically:
- Clear ALL cookies
- Clear localStorage
- Clear sessionStorage  
- Clear IndexedDB
- Redirect you to login

### Step 2: Close Browser Completely

**Important**: After the redirect, close the ENTIRE browser (not just the tab).

### Step 3: Reopen and Login

1. Open browser again
2. Go to `http://localhost:3000/login`
3. Login with your credentials
4. Should work without errors now!

## Manual Fix (If Auto-Clear Doesn't Work)

### Option 1: DevTools Manual Clear

1. Open DevTools (F12)
2. Go to **Application** tab
3. In left sidebar, expand **Storage**
4. Click **"Clear site data"** button
5. Check ALL boxes:
   - ☑ Cookies and other site data
   - ☑ Cached images and files
   - ☑ Local and session storage
   - ☑ IndexedDB
6. Click **"Clear site data"**
7. Close and reopen browser
8. Go to `/login` and login again

### Option 2: Incognito/Private Mode

1. Open **Incognito/Private window**
2. Go to `http://localhost:3000/login`
3. Login
4. Test if it works

If it works in incognito, the problem is definitely old cookies.

### Option 3: Console Script

In browser console (F12), run:

```javascript
// Clear ALL cookies with all possible options
document.cookie.split(";").forEach(c => {
  const name = c.trim().split('=')[0];
  const paths = ['/', '/login', '/homepage'];
  const domains = ['', window.location.hostname, `.${window.location.hostname}`];
  
  paths.forEach(path => {
    domains.forEach(domain => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domain ? `; domain=${domain}` : ''}`;
    });
  });
});

// Clear storage
localStorage.clear();
sessionStorage.clear();

// Clear IndexedDB
indexedDB.databases().then(dbs => {
  dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name));
});

console.log('✅ All cleared! Close browser and reopen.');
```

Then:
1. Close browser completely
2. Reopen browser
3. Go to `/login`

## Why This Happened

### Cookie Format Changed

**Old format** (`@supabase/ssr@0.1.0`):
```
sb-project-auth-token=base64-eyJhY2Nlc3NfdG9rZW4i...
```
The value was base64-encoded JSON string.

**New format** (`@supabase/ssr@0.8.0`):
```
sb-project-auth-token={"access_token":"...", "user":{...}}
```
The value is JSON, not base64.

The new code tries to parse the cookie as JSON, but finds a base64 string instead, causing the error.

## Verify Fix

After clearing and logging in again, check:

1. **Visit**: `http://localhost:3000/debug`

Should show:
```
✅ Authentication Working
✓ Client has session: Yes
✓ Server can authenticate: Yes
Logged in as: shafique@gmail.com
```

2. **Check Console**: No errors

3. **Check Cookies**: In DevTools → Application → Cookies
   - Cookie values should be JSON (not base64-)
   - Should only have cookies for `jpygbewyjbpphydcjnoy` project

## Troubleshooting

### Still Getting Error After Clearing?

1. **Restart dev server**: 
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```

2. **Check cookie format**: In DevTools → Application → Cookies
   - If you see `base64-` in cookie value, it wasn't cleared properly
   - Try incognito mode

3. **Check for service workers**: 
   - DevTools → Application → Service Workers
   - Unregister any service workers
   - Clear cache

### Error on Different Page?

The error might be coming from:
- Old cached pages
- Service worker cache

Fix:
1. Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Clear cache and hard reload: DevTools → Network → "Disable cache" checkbox

## Success Checklist

After fix, you should have:
- ✅ No console errors
- ✅ Login works
- ✅ Redirect to `/homepage` works
- ✅ Page refresh doesn't log you out
- ✅ `/debug` shows "Authentication Working"
- ✅ Cookie values are JSON (not base64-)

## Quick Test

Run this in console after login:

```javascript
// Should work without errors
const testAuth = async () => {
  try {
    const response = await fetch('/api/debug-auth');
    const data = await response.json();
    console.log('Auth status:', {
      clientWorks: document.cookie.includes('sb-jpygbewyjbpphydcjnoy'),
      serverWorks: data.auth.getUser.hasUser,
      error: data.auth.getUser.error
    });
  } catch (e) {
    console.error('Test failed:', e);
  }
};

testAuth();
```

Should output:
```javascript
{
  clientWorks: true,
  serverWorks: true,
  error: undefined
}
```

---

**TL;DR: Go to http://localhost:3000/clear-auth, let it clear everything, close browser, reopen, login again. Done!**
