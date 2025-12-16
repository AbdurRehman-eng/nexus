# 🚀 Quick Setup & Testing Guide

## 🏃‍♂️ Quick Start (5 minutes)

### 1. Run Database Migration
Copy and paste this into your Supabase SQL Editor:

```sql
-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  CHECK (char_length(description) <= 1000)
);

-- Direct messages table for private conversations
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CHECK (char_length(content) > 0 AND char_length(content) <= 10000),
  CHECK (sender_id != recipient_id)
);

-- Add online status to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_online') THEN
    ALTER TABLE public.profiles ADD COLUMN is_online BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_seen') THEN
    ALTER TABLE public.profiles ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reminders
CREATE POLICY "Users can view reminders in their workspaces"
  ON public.reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = reminders.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reminders in their workspaces"
  ON public.reminders FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = reminders.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.channel_members
      WHERE channel_members.channel_id = reminders.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reminders"
  ON public.reminders FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own reminders"
  ON public.reminders FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for direct_messages
CREATE POLICY "Users can view their own direct messages"
  ON public.direct_messages FOR SELECT
  USING (
    (auth.uid() = sender_id OR auth.uid() = recipient_id)
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = direct_messages.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send direct messages in their workspaces"
  ON public.direct_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = direct_messages.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = direct_messages.workspace_id
      AND workspace_members.user_id = direct_messages.recipient_id
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminders_workspace_id ON public.reminders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reminders_channel_id ON public.reminders(channel_id);
CREATE INDEX IF NOT EXISTS idx_reminders_created_by ON public.reminders(created_by);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_time ON public.reminders(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.reminders(status);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_id ON public.direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_workspace_id ON public.direct_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);
```

### 2. Start Your App
```bash
npm run dev
# or
pnpm dev
```

### 3. Test Features (2 minutes each)

#### ✅ Test Direct Messages:
1. Login to your workspace
2. Click "Members" in sidebar
3. Click any member name → DM modal opens
4. Send a test message

#### ✅ Test Reminders:  
1. Click "+ Reminder" button (top-right)
2. Create reminder for 2 minutes from now
3. Watch chat - message will auto-appear when due

#### ✅ Test MQL Search:
1. Click "AI Search" 
2. Try: `from:your_username AND contains("test")`
3. Should show filtered messages

#### ✅ Test Saved Items:
1. Hover over any message
2. Click save icon
3. Click "Saved Items" in sidebar
4. Your message appears there

---

## 🎯 What You'll See

### New UI Elements:
- **Members section** in sidebar (with online indicators)
- **Reminders section** in sidebar (with pending count)
- **"+ Reminder" button** in chat header
- **DM modal** when clicking members
- **Reminder creation modal** 

### New Behavior:
- **Real-time DMs** between workspace members
- **Auto reminder notifications** in channels
- **Advanced message search** with MQL queries
- **Saved message management**

---

## 🐛 Troubleshooting

### "Database error" when testing:
- Make sure you ran the SQL migration above
- Check Supabase dashboard for any failed policies

### "Not authenticated" errors:
- Refresh page and log in again
- Check browser console for auth issues

### Features not loading:
- Hard refresh (Ctrl/Cmd + F5)
- Check network tab for API errors

---

## ✨ You're Done!

All requested features are now live:
- ✅ DM system with member management  
- ✅ Automated reminder notifications
- ✅ Advanced MQL search language  
- ✅ Working saved items feature
- ✅ All existing functionality preserved

Enjoy your enhanced NEXUS workspace! 🚀