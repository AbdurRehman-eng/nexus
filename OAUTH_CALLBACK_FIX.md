# Google OAuth Callback Fix

## 🐛 Problem Identified

When users signed in with Google on production, they were redirected back to the root URL with tokens in the URL hash:

```
https://nexus-zeta-drab.vercel.app/#access_token=...&refresh_token=...
```

**Issue**: Supabase was using **implicit flow** (tokens in hash `#`) instead of **PKCE flow** (authorization code in query params `?code=...`).

### Why This Happened:
- Hash fragments (`#access_token=...`) don't reach the server
- The `/auth/callback` route couldn't process the tokens
- Users stayed on the landing page instead of being redirected to `/homepage`

---

## ✅ Solution Implemented

### 1. **Dual-Flow Client Handler**

Created a new client-side component that handles **both** OAuth flows:

**File**: `src/app/auth/callback/client-page.tsx`

- ✅ Handles **implicit flow** (hash fragments with access_token)
- ✅ Handles **PKCE flow** (query params with authorization code)
- ✅ Sets session in browser using `supabase.auth.setSession()`
- ✅ Redirects to `/homepage` after successful authentication
- ✅ Shows loading spinner during processing
- ✅ Displays error messages if authentication fails

### 2. **Server Route Update**

**File**: `src/app/auth/callback/route.ts`

The server route now returns a simple HTML page that:
- Immediately redirects to the client handler
- Preserves both query params AND hash fragments
- Redirects to `/auth/callback/complete` (client page)

### 3. **Completion Page**

**File**: `src/app/auth/callback/complete/page.tsx`

Simple Next.js page that renders the client handler component.

---

## 🔄 OAuth Flow (Updated)

```
User clicks "Continue with Google"
        ↓
Redirects to Google OAuth consent
        ↓
User authorizes app
        ↓
Google → Supabase → Your app (/auth/callback)
        ↓
Server route redirects to /auth/callback/complete (with tokens)
        ↓
Client handler extracts tokens from hash
        ↓
Sets session in browser (localStorage + cookies)
        ↓
Database trigger creates profile (if new user)
        ↓
Redirect to /homepage (logged in!) ✅
```

---

## 🎯 What Changed

### Before:
```
/auth/callback (server route)
  ↓
  Tried to read hash fragments (❌ not accessible server-side)
  ↓
  Redirect failed, user stuck on landing page
```

### After:
```
/auth/callback (server route)
  ↓
  Redirects to /auth/callback/complete (preserves hash)
  ↓
  Client handler reads hash fragments (✅ accessible client-side)
  ↓
  Sets session and redirects to /homepage
```

---

## 📝 Files Modified

1. **`src/app/actions/auth.ts`**
   - Updated `signInWithGoogle()` with better options

2. **`src/app/auth/callback/route.ts`**
   - Now serves an HTML redirect page
   - Preserves both query params and hash fragments

3. **`src/app/auth/callback/client-page.tsx`** (NEW)
   - Client-side handler for both OAuth flows
   - Handles token extraction and session setting

4. **`src/app/auth/callback/complete/page.tsx`** (NEW)
   - Next.js page wrapper for the client handler

---

## 🧪 Testing

### Production Testing:
1. Go to `https://nexus-zeta-drab.vercel.app/login`
2. Click **"Continue with Google"**
3. Authorize the app
4. ✅ You should be redirected to `/homepage` and logged in

### Development Testing:
1. Go to `http://localhost:3000/login`
2. Click **"Continue with Google"**
3. Authorize the app
4. ✅ You should be redirected to `/homepage` and logged in

---

## 🔍 Debugging

If issues persist, check the browser console for:
- `[OAuth Callback Client]` logs
- Session creation status
- Any error messages

Common logs you should see:
```
[OAuth Callback Client] Handling implicit flow (hash fragments)
[OAuth Callback Client] Setting session from hash fragments
[OAuth Callback Client] ✅ Session set successfully, redirecting to homepage
```

---

## 🎉 Result

Users can now:
- ✅ Sign in with Google on both localhost and production
- ✅ Automatically redirected to `/homepage` after authentication
- ✅ Session persists across page refreshes
- ✅ Profile automatically created in database

---

## 📚 Technical Notes

### Why Client-Side Handling?

Hash fragments (`#access_token=...`) are **never sent to the server** by browsers. They're only accessible via JavaScript in the browser. This is why we need a client-side handler.

### Implicit Flow vs PKCE Flow

- **Implicit Flow**: Tokens directly in URL hash (less secure, but simpler)
- **PKCE Flow**: Authorization code in query params, exchanged for tokens (more secure)

Our implementation handles **both** to ensure maximum compatibility.

### Supabase Auth Flows

Supabase can use different OAuth flows depending on configuration:
1. **PKCE** (Proof Key for Code Exchange) - Recommended for SPAs
2. **Implicit** - Legacy flow, tokens in URL hash
3. **Server-side** - For traditional server-rendered apps

The client handler ensures our app works with any flow Supabase chooses.

---

## 🔧 Future Improvements

To enforce PKCE flow only (more secure):

1. Update Supabase Auth settings to use PKCE by default
2. Configure `flowType: 'pkce'` in the Supabase client
3. Remove implicit flow handling from client-page.tsx

For now, the dual-flow handler ensures maximum compatibility.
