'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createWorkspace(name: string, organizationType: 'private' | 'public', coworkerEmails: string[] = []) {
  const supabase = await createClient()

  // For now, use hardcoded email until login works
  // TODO: Switch back to authenticated user once login is working
  const TEMP_OWNER_EMAIL = 'shafiqueabdurrehman@gmail.com'
  
  // Try to get authenticated user first
  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
  
  let ownerId: string | null = null
  
  if (authUser) {
    // If user is authenticated, use their ID
    ownerId = authUser.id
  } else {
    // If not authenticated, look up user by email from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', TEMP_OWNER_EMAIL)
      .single()
    
    if (profileError || !profile) {
      return { error: `User with email ${TEMP_OWNER_EMAIL} not found. Please ensure the user exists in the database.`, data: null }
    }
    
    ownerId = profile.id
  }
  
  if (!ownerId) {
    return { error: 'Unable to determine workspace owner', data: null }
  }

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
  await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: ownerId,
      role: 'owner',
    })

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

export async function getWorkspaces() {
  const supabase = await createClient()

  // Debug: Check cookies first
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  console.log('[getWorkspaces] Available cookies:', {
    count: allCookies.length,
    names: allCookies.map(c => c.name).filter(n => n.includes('supabase') || n.includes('auth'))
  })

  // Debug: Check session first
  const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession()
  console.log('[getWorkspaces] Session check:', { 
    hasSession: !!sessionData, 
    sessionError: sessionError?.message,
    userId: sessionData?.user?.id,
    expiresAt: sessionData?.expires_at
  })

  // If no session, try refreshing
  if (!sessionData) {
    console.log('[getWorkspaces] No session, attempting refresh...')
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
    console.log('[getWorkspaces] After refresh:', {
      hasSession: !!refreshedSession,
      userId: refreshedSession?.user?.id
    })
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  console.log('[getWorkspaces] User check:', { 
    hasUser: !!user, 
    userError: userError?.message,
    userId: user?.id,
    email: user?.email
  })
  
  if (userError || !user) {
    console.log('[getWorkspaces] Auth failed - returning error', {
      userError: userError?.message,
      hasUser: !!user
    })
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
