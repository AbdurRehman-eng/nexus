'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createWorkspace(name: string, organizationType: 'private' | 'public', coworkerEmails: string[] = []) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Create workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      name,
      owner_id: user.id,
      organization_type: organizationType,
    })
    .select()
    .single()

  if (workspaceError) {
    return { error: workspaceError.message, data: null }
  }

  // Add coworkers as members if provided
  if (coworkerEmails.length > 0) {
    // Get user IDs for emails
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .in('email', coworkerEmails)

    if (profiles && profiles.length > 0) {
      const memberInserts = profiles.map(profile => ({
        workspace_id: workspace.id,
        user_id: profile.id,
        role: 'member' as const,
      }))

      await supabase
        .from('workspace_members')
        .insert(memberInserts)
    }
  }

  // Create default channel
  const { data: channel } = await supabase
    .from('channels')
    .insert({
      workspace_id: workspace.id,
      name: 'general',
      description: 'General discussion',
      is_private: false,
      created_by: user.id,
    })
    .select()
    .single()

  if (channel) {
    // Add creator as channel member
    await supabase
      .from('channel_members')
      .insert({
        channel_id: channel.id,
        user_id: user.id,
      })
  }

  revalidatePath('/homepage')
  return { data: workspace, error: null }
}

export async function getWorkspaces() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner(user_id),
      channels(count)
    `)
    .eq('workspace_members.user_id', user.id)

  if (error) {
    return { error: error.message, data: null }
  }

  // Format the response
  const formattedWorkspaces = workspaces?.map(workspace => ({
    id: workspace.id,
    name: workspace.name,
    owner: workspace.owner_id === user.id ? 'You' : 'Other',
    designation: workspace.workspace_members?.[0]?.role === 'owner' ? 'Owner' : 'Member',
    channelsCount: Array.isArray(workspace.channels) ? workspace.channels.length : 0,
  })) || []

  return { data: formattedWorkspaces, error: null }
}

export async function getWorkspace(workspaceId: string) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner(user_id, role)
    `)
    .eq('id', workspaceId)
    .eq('workspace_members.user_id', user.id)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data: workspace, error: null }
}
