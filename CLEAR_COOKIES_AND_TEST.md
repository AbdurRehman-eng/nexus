# Clear Cookies and Test - Complete Instructions

## The Problem

You have "Auth session missing!" even though cookies exist. This means:
- Cookies from the **wrong project** are interfering
- Or cookies are **malformed/corrupted**

## Step-by-Step Fix

### Step 1: Check Current State

Visit this URL: **http://localhost:3000/api/debug-auth**

This will show you:
- Which cookies are present
- Which project they're for
- What the auth error is

Copy the JSON output and save it (we'll compare later).

### Step 2: Clear ALL Cookies (Critical!)

Open DevTools (F12) → Console, then run:

```javascript
// Clear ALL cookies (run this line by line)
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

// Clear storage
localStorage.clear();
sessionStorage.clear();

// Verify cookies are gone
console.log('Remaining cookies:', document.cookie);
// Should be empty or just a few system cookies
```

### Step 3: Close and Reopen Browser

**Important**: Don't just refresh - actually:
1. Close the browser tab
2. Close the entire browser window  
3. Reopen browser
4. Go to http://localhost:3000/login

This ensures all in-memory session data is cleared.

### Step 4: Check Environment is Loaded

Before logging in, visit the debug endpoint again:
**http://localhost:3000/api/debug-auth**

Should show:
```json
{
  "environment": {
    "projectRef": "jpygbewyjbpphydcjnoy"  ← Verify this is correct
  },
  "cookies": {
    "supabaseCookies": []  ← Should be EMPTY
  }
}
```

### Step 5: Login Fresh

1. Go to http://localhost:3000/login
2. Enter credentials: `shafique@gmail.com`
3. Click "Sign In"
4. **Before being redirected**, open DevTools Console
5. Check the cookie debug output:

```
[Login] Cookies in document.cookie: {
  hasCookies: true,
  supabaseCookies: ['sb-jpygbewyjbpphydcjnoy-auth-token']  ← Should have THIS project
}
```

### Step 6: Check Debug Endpoint Again

After login, visit: **http://localhost:3000/api/debug-auth**

Should show:
```json
{
  "auth": {
    "getUser": {
      "hasUser": true,        ← Should be TRUE
      "userId": "...",
      "email": "shafique@gmail.com"
    }
  },
  "diagnosis": {
    "cookiesPresent": true,
    "correctProject": true,
    "wrongProject": false,    ← Should be FALSE
    "canAuthenticate": true   ← Should be TRUE
  }
}
```

## What to Check

### If Still Failing

1. **Wrong project cookies?**
   - Check `diagnosis.wrongProject` in debug output
   - If `true`, cookies weren't fully cleared - try incognito mode

2. **Cookie format wrong?**
   - Check `cookies.supabaseCookies` in debug output
   - Should see ONE cookie like: `sb-jpygbewyjbpphydcjnoy-auth-token`

3. **Environment not loaded?**
   - Check `environment.projectRef` matches your Supabase project
   - Restart dev server if needed

## Alternative: Use Incognito/Private Mode

If clearing cookies doesn't work:

1. Open **Incognito/Private browsing window**
2. Go to http://localhost:3000/login
3. Login
4. Test if it works

Incognito starts with NO cookies, so there's no chance of conflicts.

## What to Share with Me

After testing, share:

1. **Before clearing cookies**: Visit http://localhost:3000/api/debug-auth and copy the JSON

2. **After login**: Visit http://localhost:3000/api/debug-auth again and copy the JSON

The debug endpoint will tell us EXACTLY what's wrong.

## Quick Test Script

Run all of this in browser console after logging in:

```javascript
// Check if session exists client-side
const supabase = createClient();
const { data } = await supabase.auth.getSession();
console.log('Client session:', {
  hasSession: !!data.session,
  userId: data.session?.user?.id,
  expiresAt: new Date(data.session?.expires_at * 1000)
});

// Check cookies
console.log('Cookies:', document.cookie.split(';').filter(c => c.includes('sb-')));

// Check server can auth
const response = await fetch('/api/debug-auth');
const serverAuth = await response.json();
console.log('Server auth:', serverAuth.auth.getUser);
```

This will show if the problem is client-side or server-side.
