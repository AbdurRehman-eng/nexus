-- Message attachments table
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CHECK (file_size > 0 AND file_size <= 10485760) -- Max 10MB
);

-- Enable RLS
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_attachments
-- Users can view attachments in channels they're members of
CREATE POLICY "Users can view attachments in their channels"
  ON public.message_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.channel_members cm ON cm.channel_id = m.channel_id
      WHERE m.id = message_attachments.message_id
      AND cm.user_id = auth.uid()
    )
  );

-- Users can insert attachments to messages in their channels
CREATE POLICY "Users can upload attachments to their messages"
  ON public.message_attachments
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.channel_members cm ON cm.channel_id = m.channel_id
      WHERE m.id = message_attachments.message_id
      AND cm.user_id = auth.uid()
    )
  );

-- Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
  ON public.message_attachments
  FOR DELETE
  USING (uploaded_by = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id 
  ON public.message_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_uploaded_by 
  ON public.message_attachments(uploaded_by);

-- Add edited_at and deleted_at columns to messages table (if not exists)
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
