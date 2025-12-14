# Google OAuth Quick Start ⚡

## ✅ Already Implemented (No Coding Needed!)

Your app already has Google OAuth fully coded and ready to use:

1. ✅ **Database Trigger** - Auto-creates profiles for OAuth users
2. ✅ **OAuth Callback Route** - Handles Google redirect and session creation
3. ✅ **Login Page** - "Continue with Google" button ready
4. ✅ **Register Page** - "Continue with Google" button ready
5. ✅ **Error Handling** - Graceful error messages and logging
6. ✅ **Session Management** - Proper cookie/localStorage handling

## 🎯 What You Need to Do (Configuration Only)

### Step 1: Google Cloud Console (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Configure OAuth consent screen (if first time):
   - App name: **NEXUS**
   - User support email: Your email
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     http://localhost:3000/auth/callback
     https://your-production-domain.com/auth/callback
     ```
7. **Copy your Client ID and Client Secret**

### Step 2: Supabase Dashboard (3 minutes)

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** and enable it
5. Paste your **Client ID** and **Client Secret** from Google
6. Copy the Supabase callback URL shown (looks like `https://xxx.supabase.co/auth/v1/callback`)
7. Go back to Google Cloud Console and add this Supabase URL to **Authorized redirect URIs**
8. In Supabase, go to **Authentication** → **URL Configuration**
9. Set **Site URL** to:
   - Development: `http://localhost:3000`
   - Production: Your production URL

### Step 3: Test It! (1 minute)

1. Start your dev server: `pnpm dev`
2. Go to `http://localhost:3000/login`
3. Click **"Continue with Google"**
4. Authorize your app in Google
5. You should be redirected to `/homepage` and logged in! 🎉

## 🎨 How It Looks

### Login Page
```
┌─────────────────────────────────────┐
│ NEXUS                               │
│                                     │
│ Email: ________________             │
│ Password: ____________              │
│                                     │
│ [        Sign In        ]           │
│                                     │
│ ─────── Or continue with ─────────  │
│                                     │
│ [ 🔵 Continue With Google ]         │
│                                     │
│ Don't have an account? Sign Up      │
└─────────────────────────────────────┘
```

### Register Page
```
┌─────────────────────────────────────┐
│ NEXUS                               │
│                                     │
│ Email: ________________             │
│ Password: ____________              │
│                                     │
│ [      Register         ]           │
│                                     │
│ ─────── Or continue with ─────────  │
│                                     │
│ [ 🔵 Continue With Google ]         │
│                                     │
│ Already have an account? Sign In    │
└─────────────────────────────────────┘
```

## 🚀 After Setup

Once configured, your users can:
- ✅ Sign in with Google (no password needed)
- ✅ Register with Google (creates profile automatically)
- ✅ Switch between email/password and Google auth
- ✅ Stay logged in across sessions

## 📖 Need More Details?

See the comprehensive guide: **`GOOGLE_OAUTH_SETUP.md`**

## 🎉 That's It!

No code changes needed - just configure Google and Supabase, and you're ready to go!
