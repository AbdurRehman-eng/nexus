# Authentication Testing Checklist

After the Supabase SSR authentication fixes, use this checklist to verify everything works correctly.

## Prerequisites

1. **Restart the development server** to clear any cached modules
   ```bash
   # Stop the current dev server (Ctrl+C)
   npm run dev
   ```

2. **Clear browser data** for localhost
   - Open DevTools (F12)
   - Go to Application tab → Storage → Clear site data
   - Or use incognito/private browsing

3. **Verify environment variables** are set correctly
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Test Cases

### 1. Email/Password Login ✓

**Steps:**
1. Navigate to `/login`
2. Enter valid email and password
3. Click "Sign In"
4. Should redirect to `/homepage`
5. Should see workspaces (or "create workspace" message)

**What to check:**
- [ ] No console errors during login
- [ ] Cookies are set (check DevTools → Application → Cookies)
  - Should see `sb-{projectRef}-auth-token` cookie
- [ ] User stays logged in on page refresh
- [ ] `/homepage` loads successfully without redirect back to login

**Console logs to verify:**
```
[Login] ===== LOGIN ATTEMPT START =====
[Login] Calling signInWithPassword...
[Login] Login successful: { userId: '...', email: '...' }
[Login] Session verification: { hasSession: true, userId: '...' }
[Login] ===== LOGIN SUCCESS - REDIRECTING =====
```

### 2. Email/Password Registration ✓

**Steps:**
1. Navigate to `/register`
2. Enter new email and password (min 6 chars)
3. Click "Register"
4. Depending on Supabase settings:
   - **With email confirmation**: Should show alert and redirect to login
   - **Without email confirmation**: Should auto-login and redirect to homepage

**What to check:**
- [ ] No console errors during registration
- [ ] If auto-login enabled, user is signed in immediately
- [ ] Cookies are set if auto-login enabled
- [ ] If email confirmation required, appropriate message shown

**Console logs to verify:**
```
[Register] Calling signUp...
[Register] Registration successful, user auto-signed in: { userId: '...', email: '...' }
```

### 3. Google OAuth Login ✓

**Steps:**
1. Navigate to `/login`
2. Click "Continue With Google"
3. Complete Google OAuth flow
4. Should redirect back to `/auth/callback`
5. Should automatically redirect to `/homepage`

**What to check:**
- [ ] OAuth flow completes successfully
- [ ] Callback handler sets cookies
- [ ] User is redirected to homepage
- [ ] User stays logged in

### 4. Protected Route Access ✓

**Steps:**
1. While logged OUT, try to navigate to `/homepage`
2. Should see auth check and redirect to `/login`
3. Log in
4. Navigate to `/homepage`
5. Should load successfully

**What to check:**
- [ ] Unauthenticated users cannot access `/homepage`
- [ ] After login, `/homepage` is accessible
- [ ] Middleware properly validates authentication

### 5. Logout ✓

**Steps:**
1. While logged in, click "Logout" button on homepage
2. Should clear cookies and redirect to `/login`
3. Try navigating to `/homepage`
4. Should redirect back to `/login`

**What to check:**
- [ ] Cookies are cleared
- [ ] User is redirected to login
- [ ] Cannot access protected routes after logout

### 6. Session Persistence ✓

**Steps:**
1. Log in successfully
2. Refresh the page
3. Close and reopen the tab
4. Restart the browser (keep cookies)

**What to check:**
- [ ] User stays logged in across page refreshes
- [ ] User stays logged in across tab close/open
- [ ] Session persists until cookie expires

### 7. Server Action Authentication ✓

**Steps:**
1. Log in
2. Navigate to `/homepage`
3. Server action `getWorkspaces()` should execute successfully
4. Check console for authentication logs

**What to check:**
- [ ] `getWorkspaces()` doesn't return "Not authenticated" error
- [ ] Server successfully reads cookies from request
- [ ] `getClaims()` returns valid claims

**Console logs to verify:**
```
[getWorkspaces] ===== GET WORKSPACES START =====
[getWorkspaces] Available cookies: { total: X, supabaseCookies: [...] }
[getWorkspaces] Claims check: { hasClaims: true, userId: '...', email: '...' }
```

### 8. Middleware Validation ✓

**Steps:**
1. Open DevTools → Network tab
2. Log in and navigate between pages
3. Check middleware logs in server console

**What to check:**
- [ ] Middleware logs show `hasClaims: true` for authenticated requests
- [ ] Middleware logs show user ID correctly
- [ ] No "Auth session missing!" errors

**Console logs to verify:**
```
[Middleware] getClaims result: {
  hasClaims: true,
  userId: 'valid-user-id',
  cookieCount: X
}
```

## Common Issues & Solutions

### Issue: "Auth session missing!" even after login

**Diagnosis:**
- Check if cookies are being set (DevTools → Application → Cookies)
- Check cookie domain and path
- Verify cookie names match expected pattern: `sb-{projectRef}-auth-token`

**Solutions:**
- Clear all cookies and try again
- Restart dev server
- Check that `NEXT_PUBLIC_SUPABASE_URL` is correct

### Issue: Login succeeds but redirects back to login

**Diagnosis:**
- Cookies might be set but not being sent with requests
- Middleware might not be reading cookies correctly

**Solutions:**
- Check Network tab to see if cookies are included in requests
- Verify middleware is not blocking authenticated routes
- Check that cookie path is `/` (not restricted)

### Issue: "Failed to create session"

**Diagnosis:**
- Invalid credentials
- Supabase connection issue

**Solutions:**
- Verify email and password are correct
- Check Supabase dashboard to ensure user exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

### Issue: Client session exists but server doesn't recognize it

**Diagnosis:**
- Cookie not being sent from client to server
- Cookie format mismatch

**Solutions:**
- This should be fixed by the new client-side auth approach
- Verify `httpOnly` flag is `false` for SSR cookies
- Check that `sameSite` is `lax` or `none`

## Success Criteria

All tests pass with:
- ✅ No console errors
- ✅ Cookies set correctly
- ✅ Session persists across requests
- ✅ Middleware validates authentication
- ✅ Server actions can read user session
- ✅ Protected routes are properly guarded

## Performance Check

After fixes, authentication should be:
- **Fast**: Login completes in < 2 seconds
- **Reliable**: Works consistently across page loads
- **Secure**: Cookies are httpOnly=false but still secure in production
- **Seamless**: No visible delays or errors during auth flow
