# Supabase SSR Authentication Fix

## Problem Summary

The authentication was failing because of a broken server-side cookie management approach. Users could sign in successfully (session created on Supabase), but subsequent requests would fail authentication checks because cookies were not being set properly.

### Symptoms
- Login appeared to succeed (session created)
- Cookies were present in requests
- But `getClaims()` in middleware and server actions returned `false`
- Users were redirected back to login page

### Root Cause

The issue was caused by mixing server-side and client-side authentication in a way that's incompatible with Next.js 14+ and Supabase SSR:

1. **Server Action Cookie Setting Failure** (`src/app/actions/auth.ts`):
   - The `signIn` server action called `setSession()` to trigger cookie setting
   - This called `setAll()` in the server client to set cookies
   
2. **Silent Failure in Server Client** (`src/lib/supabase/server.ts`):
   - The `setAll()` callback had a try-catch that silently caught errors
   - In Next.js 14+, Server Actions cannot directly set response cookies
   - The `cookieStore.set()` call threw an error, which was caught and ignored
   
3. **Cookie Mismatch**:
   - Server-side cookies were never set
   - Client-side tried to set cookies, but there was a mismatch
   - Result: Invalid or missing session cookies

4. **Additional Issues**:
   - Unused API route (`/api/auth/login`) had broken cookie management
   - Bug in `getWorkspaces()` referencing undefined `user` variable

## Solution

### 1. Simplified Authentication Flow (`src/app/login/page.tsx`)

**Before**: Mixed server action + client session setting
```typescript
// Called server action
const result = await signIn(email, password);
// Then manually set session on client
await supabase.auth.setSession({...});
```

**After**: Pure client-side authentication
```typescript
// Direct client-side sign in
const supabase = createClient();
const { data, error } = await supabase.auth.signInWithPassword({
  email: email.trim().toLowerCase(),
  password,
});
// Cookies are set automatically by the browser client
```

**Why**: Client-side Supabase auth automatically manages cookies correctly. Server Actions in Next.js 14+ cannot reliably set response cookies.

### 2. Updated Server Action (`src/app/actions/auth.ts`)

**Before**:
```typescript
await supabase.auth.setSession({
  access_token: data.session.access_token,
  refresh_token: data.session.refresh_token,
});
```

**After**:
```typescript
// Don't call setSession here - it fails silently in Server Actions
// The client-side code will handle setting the session in the browser
```

**Why**: Server Actions can't set cookies in responses. This was failing silently and causing the auth to break.

### 3. Improved Server Client Logging (`src/lib/supabase/server.ts`)

**Before**: Silent catch with no indication of failure

**After**: Added logging to indicate when `setAll` is called from read-only context

**Why**: Better debugging and understanding of when/why cookies aren't being set server-side.

### 4. Removed Broken API Route

Deleted `/api/auth/login/route.ts` which had:
- Empty `setAll()` callback
- Manual cookie construction that didn't match Supabase's format
- Was not being used by the frontend

### 5. Fixed Bug in `getWorkspaces()`

**Before**:
```typescript
owner: workspace.owner_id === user.id ? 'You' : 'Other'
// user was undefined!
```

**After**:
```typescript
owner: workspace.owner_id === userId ? 'You' : 'Other'
// userId comes from claims
```

## How It Works Now

### Authentication Flow

1. **Login** (Client-side):
   ```
   User enters credentials
   → Browser Supabase client calls signInWithPassword()
   → Supabase returns session
   → Browser client automatically sets cookies (httpOnly=false for SSR)
   → User redirects to /homepage
   ```

2. **Authenticated Requests** (Server-side):
   ```
   Browser sends request with cookies
   → Middleware runs updateSession()
   → Creates server client that reads cookies
   → Calls getClaims() to validate JWT
   → Request proceeds if valid
   ```

3. **Server Actions** (Server-side):
   ```
   Client calls getWorkspaces()
   → Server action creates server client
   → Reads cookies from request
   → Calls getClaims() to validate
   → Returns data if authenticated
   ```

### Key Principles

1. **Client-side for write**: Use browser client for login/signup/logout (it manages cookies)
2. **Server-side for read**: Use server client for validating auth and reading user data
3. **No cookie manipulation**: Let Supabase SSR handle all cookie operations
4. **Middleware validation**: Use `getClaims()` in middleware to validate on every request

## Testing

After these changes, the authentication flow should work as follows:

1. User visits `/login`
2. Enters credentials and clicks "Sign In"
3. Client-side auth succeeds and sets cookies
4. Redirects to `/homepage`
5. Middleware validates cookies successfully
6. Homepage server action reads user data successfully
7. User sees their workspaces

## References

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Next.js 14 Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase Auth Helpers Migration Guide](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers)

## Troubleshooting

If authentication still doesn't work:

1. **Clear browser cookies**: Old/corrupted cookies can interfere
2. **Check environment variables**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
3. **Restart dev server**: Sometimes needed after env changes
4. **Check cookie settings**: In production, ensure `secure` flag is set correctly
5. **Verify domain**: Cookies must be set on the same domain as the app

## Migration Notes

If you have other server actions that try to set sessions, update them similarly:
- Remove `setSession()` calls from server actions
- Let client-side code handle authentication
- Use server actions only for data fetching with existing auth
