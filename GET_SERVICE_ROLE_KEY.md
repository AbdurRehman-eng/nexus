# 🔑 Get Your Supabase SERVICE_ROLE Key

## Why You Need It

The `SERVICE_ROLE_KEY` allows server-side operations to bypass Row Level Security (RLS) policies. Without it, the server can't insert data into protected tables like `workspace_members`.

## Steps to Get It

### 1. Go to Supabase Dashboard

Visit: https://supabase.com/dashboard/project/jpygbewyjbpphydcjnoy/settings/api

### 2. Find the Service Role Key

Look for the section called **"Project API keys"**

You'll see:
- ✅ **anon** / **public** - Already have this
- 🔑 **service_role** - **This is what you need!**

### 3. Copy the Service Role Key

1. Click the **eye icon** 👁️ to reveal the key
2. Click **Copy** to copy it
3. It will start with `eyJ...` (very long)

### 4. Add to .env.local

Open `d:\Projects\nexus\.env.local` and replace:

```
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

With:

```
SUPABASE_SERVICE_ROLE_KEY=eyJ... (your actual key)
```

### 5. Restart Dev Server

**IMPORTANT**: After adding the key, restart your server:

```bash
# Stop server (Ctrl+C)
npm run dev
```

## ⚠️ Security Warning

**NEVER commit or share your SERVICE_ROLE_KEY publicly!**

- ❌ Don't commit to GitHub
- ❌ Don't share in screenshots
- ❌ Don't use in client-side code
- ✅ Only use on the server
- ✅ Keep in `.env.local` (already in `.gitignore`)

## Verify It Works

After adding the key and restarting:

1. Go to `/workspace/create`
2. Create a test workspace
3. Check the terminal logs for:
   ```
   [createWorkspace] Added owner as member: { memberData: [...], memberError: undefined }
   ```
4. Go to `/homepage` - workspaces should now appear! ✅

---

**Quick Link**: https://supabase.com/dashboard/project/jpygbewyjbpphydcjnoy/settings/api
