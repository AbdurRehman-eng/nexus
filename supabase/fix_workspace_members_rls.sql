-- Fix infinite recursion in workspace_members RLS policy
-- The issue: The SELECT policy was querying workspace_members itself, causing infinite recursion
-- Solution: Check workspaces table for ownership instead

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;

-- Create a new policy that avoids recursion by checking workspaces table first
CREATE POLICY "Users can view members of their workspaces"
  ON public.workspace_members FOR SELECT
  USING (
    -- User is the owner of the workspace (check workspaces table, not workspace_members)
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE workspaces.id = workspace_members.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
    OR
    -- User is viewing their own membership record
    workspace_members.user_id = auth.uid()
  );
