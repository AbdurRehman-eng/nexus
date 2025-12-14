-- Calls table
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Call participants table
CREATE TABLE IF NOT EXISTS public.call_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_muted BOOLEAN DEFAULT FALSE,
  is_camera_off BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(call_id, user_id)
);

-- Enable RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calls
CREATE POLICY "Workspace members can view calls"
  ON public.calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = calls.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create calls"
  ON public.calls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = calls.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update calls"
  ON public.calls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = calls.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- RLS Policies for call_participants
CREATE POLICY "Users can view call participants"
  ON public.call_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.calls
      JOIN public.workspace_members ON workspace_members.workspace_id = calls.workspace_id
      WHERE calls.id = call_participants.call_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join calls"
  ON public.call_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calls
      JOIN public.workspace_members ON workspace_members.workspace_id = calls.workspace_id
      WHERE calls.id = call_participants.call_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own participant record"
  ON public.call_participants
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can leave calls"
  ON public.call_participants
  FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calls_workspace_id ON public.calls(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_call_participants_call_id ON public.call_participants(call_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_user_id ON public.call_participants(user_id);
