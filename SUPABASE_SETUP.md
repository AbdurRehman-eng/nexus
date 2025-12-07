# Supabase Setup Guide

This guide will help you set up the Supabase database for the Nexus application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Access to your Supabase project dashboard

## Setup Steps

### 1. Create a New Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in your project details
4. Note your project URL and anon key (you'll need these)

### 2. Run the Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

**Note:** If you plan to use vector embeddings for semantic search, you'll need to enable the `pgvector` extension. Add this line at the top of your SQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Then uncomment the embedding column in the messages table.

### 3. Configure Environment Variables

The `.env.local` file has been created with your Supabase credentials. Make sure the values are correct:

```
NEXT_PUBLIC_SUPABASE_URL=https://jpygbewyjbpphydcjnoy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4BR-9gFCnnH7k6iHD2hmmQ_UsKmVz-e
```

### 4. Enable Google OAuth (Optional)

If you want to enable Google OAuth:

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth credentials (Client ID and Client Secret)
4. Add your redirect URL: `http://localhost:3000/auth/callback` (for development)

### 5. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/register`
3. Create a new account
4. You should be redirected to the homepage
5. Create a workspace
6. Navigate to the chat page and send a message

## Database Schema Overview

The schema includes the following tables:

- **profiles**: User profiles (extends Supabase auth.users)
- **workspaces**: Workspace/organization data
- **workspace_members**: Many-to-many relationship between users and workspaces
- **channels**: Chat channels within workspaces
- **channel_members**: Many-to-many relationship between users and channels
- **messages**: Chat messages
- **message_reactions**: Message reactions/emojis

All tables have Row Level Security (RLS) enabled with appropriate policies to ensure users can only access data they're authorized to see.

## Troubleshooting

### "Not authenticated" errors

- Make sure you're logged in
- Check that the session cookie is being set correctly
- Verify your Supabase credentials in `.env.local`

### Database connection errors

- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is active
- Ensure the database schema has been run successfully

### RLS policy errors

- Make sure all RLS policies in the schema were created successfully
- Check the Supabase logs for specific policy errors
- Verify that the `auth.users` table exists (created automatically by Supabase)

## Next Steps

After setup, you can:

1. Customize the database schema for your needs
2. Add additional features (file uploads, notifications, etc.)
3. Set up real-time subscriptions for live updates
4. Configure email templates for authentication
5. Set up backup and monitoring
