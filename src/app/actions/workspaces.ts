'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Helper to create admin client for server-side operations
// Uses SERVICE_ROLE key to bypass RLS policies
function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    console.error('[getSupabaseAdmin] SERVICE_ROLE_KEY not found, falling back to ANON_KEY')
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function createWorkspace(accessToken: string, name: string, organizationType: 'private' | 'public', coworkerEmails: string[] = []) {
  const supabase = getSupabaseAdmin()
  
  // Validate token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const ownerId = user.id

  // Create workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      name,
      owner_id: ownerId,
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

  // Add owner as workspace member
  const { data: memberData, error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: ownerId,
      role: 'owner',
    })
    .select()
  
  console.log('[createWorkspace] Added owner as member:', { 
    workspaceId: workspace.id, 
    userId: ownerId, 
    memberData,
    memberError: memberError?.message 
  })
  
  // Check if member insert failed
  if (memberError) {
    console.error('[createWorkspace] Failed to add owner as member:', memberError)
    return { error: `Workspace created but failed to add you as member: ${memberError.message}`, data: null }
  }

  // Create default channel
  const { data: channel } = await supabase
    .from('channels')
    .insert({
      workspace_id: workspace.id,
      name: 'general',
      description: 'General discussion',
      is_private: false,
      created_by: ownerId,
    })
    .select()
    .single()

  if (channel) {
    // Add creator as channel member
    await supabase
      .from('channel_members')
      .insert({
        channel_id: channel.id,
        user_id: ownerId,
      })
  }

  revalidatePath('/homepage')
  return { data: workspace, error: null }
}

export async function getWorkspaces(accessToken: string) {
  const supabase = getSupabaseAdmin()

  // Validate token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  
  if (authError || !user) {
    console.error('[getWorkspaces] Not authenticated:', authError?.message)
    return { error: 'Not authenticated', data: null }
  }

  // Get user ID from user object
  const userId = user.id
  
  console.log('[getWorkspaces] Fetching workspaces for user:', userId)

  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner(user_id, role),
      channels(count)
    `)
    .eq('workspace_members.user_id', userId)

  console.log('[getWorkspaces] Query result:', { 
    workspaceCount: workspaces?.length || 0, 
    error: error?.message,
    workspaces: workspaces 
  })

  if (error) {
    console.error('[getWorkspaces] Query error:', error)
    return { error: error.message, data: null }
  }

  // Format the response
  const formattedWorkspaces = workspaces?.map(workspace => ({
    id: workspace.id,
    name: workspace.name,
    owner: workspace.owner_id === userId ? 'You' : 'Other',
    designation: workspace.workspace_members?.[0]?.role === 'owner' ? 'Owner' : 'Member',
    channelsCount: Array.isArray(workspace.channels) ? workspace.channels.length : 0,
  })) || []
  
  console.log('[getWorkspaces] Formatted workspaces:', formattedWorkspaces)

  return { data: formattedWorkspaces, error: null }
}

export async function getWorkspace(accessToken: string, workspaceId: string) {
  const supabase = getSupabaseAdmin()

  // Validate token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !user) {
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
