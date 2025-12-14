# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for your NEXUS application.

## 🎯 Overview

Google OAuth allows users to sign in/register using their Google accounts. The implementation includes:
- ✅ **Automatic profile creation** via database trigger
- ✅ **Seamless login/registration** with Google button
- ✅ **Session management** with proper cookie handling
- ✅ **OAuth callback route** to exchange auth codes for sessions

## 📋 Prerequisites

1. **Supabase Project** with authentication enabled
2. **Google Cloud Console** account
3. **Domain/URL** where your app is hosted (for production)

---

## 🔧 Step 1: Configure Google Cloud Console

### 1.1 Create OAuth 2.0 Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Choose **"Web application"** as the application type

### 1.2 Configure OAuth Consent Screen

Before creating credentials, you'll need to configure the OAuth consent screen:

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for public apps) or **Internal** (for Google Workspace only)
3. Fill in the required information:
   - **App name**: NEXUS
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes (optional, default scopes are sufficient)
5. Save and continue

### 1.3 Set Authorized Redirect URIs

In your OAuth 2.0 Client ID configuration:

**For Development (localhost):**
```
http://localhost:3000/auth/callback
```

**For Production:**
```
https://your-domain.com/auth/callback
```

**For Vercel Preview Deployments:**
```
https://*.vercel.app/auth/callback
```

6. Click **"Create"** and save your credentials
7. **Important**: Copy the **Client ID** and **Client Secret**

---

## 🔐 Step 2: Configure Supabase

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and enable it
5. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

### 2.2 Configure Redirect URLs

Supabase shows the callback URL to whitelist in Google. It should be:
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Add this URL to your Google OAuth Client's **Authorized redirect URIs**.

### 2.3 Set Site URL (Important!)

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your application URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

This ensures OAuth redirects users back to your app after authentication.

---

## 🌐 Step 3: Environment Variables

### 3.1 Add to `.env.local`

You don't need additional environment variables! The existing Supabase configuration is sufficient:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Set this for production deployments
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 3.2 Vercel Environment Variables (for Production)

If deploying to Vercel, add these environment variables:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add all variables from `.env.local`
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain

---

## 🛠️ Step 4: Database Setup

The database trigger for automatic profile creation is already set up in `schema.sql`:

```sql
-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

✅ This trigger automatically creates a profile for **both email/password AND Google OAuth users**.

---

## 🎨 Step 5: UI Components (Already Implemented)

### Login Page (`src/app/login/page.tsx`)
```typescript
const handleGoogleLogin = async () => {
  setError('');
  setLoading(true);
  await signInWithGoogle();
};
```

### Register Page (`src/app/register/page.tsx`)
```typescript
const handleGoogleLogin = async () => {
  setError('');
  setLoading(true);
  await signInWithGoogle();
};
```

Both pages have the **"Continue with Google"** button that triggers OAuth flow.

---

## 🔄 Step 6: OAuth Flow (How It Works)

### Flow Diagram:

```
1. User clicks "Continue with Google"
   ↓
2. Client calls signInWithGoogle() server action
   ↓
3. Supabase redirects to Google OAuth consent screen
   ↓
4. User authorizes the app in Google
   ↓
5. Google redirects to: https://<supabase-url>/auth/v1/callback
   ↓
6. Supabase processes auth and redirects to: https://<your-app>/auth/callback?code=...
   ↓
7. OAuth callback route (/auth/callback) exchanges code for session
   ↓
8. Database trigger creates profile (if new user)
   ↓
9. User redirected to /homepage
```

### Server Action (`src/app/actions/auth.ts`)

```typescript
export async function signInWithGoogle() {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return { error: error.message, data: null }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { data, error: null }
}
```

### OAuth Callback Route (`src/app/auth/callback/route.ts`)

This route:
- ✅ Receives the authorization code from Google
- ✅ Exchanges it for a Supabase session
- ✅ Handles errors gracefully
- ✅ Redirects user to homepage on success

---

## ✅ Testing Checklist

### Development Testing (localhost:3000)

1. **Start your dev server**: `pnpm dev`
2. **Navigate to login page**: `http://localhost:3000/login`
3. **Click "Continue with Google"**
4. **Expected behavior**:
   - Redirects to Google OAuth consent screen
   - Shows your app name and requested permissions
   - After authorization, redirects back to your app
   - User is logged in and redirected to `/homepage`
5. **Verify profile creation**:
   - Check Supabase **Authentication** → **Users** tab
   - Check **Table Editor** → **profiles** table
   - Confirm user profile exists with correct email and username

### Production Testing

1. **Deploy to production** (Vercel/Netlify)
2. **Update Google OAuth redirect URIs** with production URL
3. **Test the same flow** as development
4. **Check browser console** for any errors
5. **Verify session persistence** (refresh page, user stays logged in)

---

## 🐛 Troubleshooting

### Issue: "redirect_uri_mismatch" Error

**Cause**: The redirect URI in your request doesn't match what's configured in Google Cloud Console.

**Solution**:
1. Check your Google OAuth Client's **Authorized redirect URIs**
2. Ensure you've added:
   - `http://localhost:3000/auth/callback` (for dev)
   - `https://your-domain.com/auth/callback` (for prod)
   - The Supabase callback URL from your Supabase dashboard

### Issue: "Failed to complete sign in"

**Cause**: Code exchange failed or session not created.

**Solution**:
1. Check browser console for detailed error logs
2. Verify Supabase credentials are correct in `.env.local`
3. Check that Google OAuth is enabled in Supabase dashboard
4. Ensure Google Client Secret is correctly entered in Supabase

### Issue: User authenticated but no profile

**Cause**: Database trigger not running or RLS policies blocking insert.

**Solution**:
1. Check if `handle_new_user()` trigger exists in Supabase SQL Editor
2. Verify RLS policies on `profiles` table allow inserts
3. Check Supabase logs for any trigger errors

### Issue: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not properly configured.

**Solution**:
1. Complete the OAuth consent screen configuration in Google Cloud Console
2. Add test users if app is in "Testing" mode
3. Publish app for production use

---

## 🔒 Security Considerations

1. **Never expose Client Secret**: Keep it in environment variables only
2. **Use HTTPS in production**: Required for secure OAuth flow
3. **Validate redirect URLs**: Only allow trusted domains
4. **Set appropriate scopes**: Request only necessary permissions
5. **Handle token refresh**: Supabase handles this automatically
6. **RLS policies**: Ensure profiles table has proper row-level security

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)

---

## ✨ Features Included

- ✅ **Google Sign In** on login page
- ✅ **Google Sign Up** on register page  
- ✅ **Automatic profile creation** via database trigger
- ✅ **Session management** with cookies
- ✅ **Error handling** with user-friendly messages
- ✅ **Logging** for debugging OAuth flow
- ✅ **Production-ready** deployment configuration

---

## 🎉 You're Done!

Your Google OAuth authentication is now fully configured. Users can sign in/register with just a few clicks! 🚀
