'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
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

export async function createCall(accessToken: string, workspaceId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Verify user is workspace member
  const { data: member } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return { error: 'Not a workspace member', data: null }
  }

  // Create call record
  const { data: call, error } = await supabase
    .from('calls')
    .insert({
      workspace_id: workspaceId,
      created_by: user.id,
      status: 'active',
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  // Add creator as first participant
  await supabase
    .from('call_participants')
    .insert({
      call_id: call.id,
      user_id: user.id,
      is_muted: false,
      is_camera_off: false
    })

  revalidatePath('/call')
  return { data: call, error: null }
}

export async function getActiveCall(accessToken: string, workspaceId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const { data: call, error } = await supabase
    .from('calls')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data: call, error: null }
}

export async function joinCall(accessToken: string, callId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Check if already in call
  const { data: existing } = await supabase
    .from('call_participants')
    .select('*')
    .eq('call_id', callId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return { data: existing, error: null }
  }

  // Add as participant
  const { data, error } = await supabase
    .from('call_participants')
    .insert({
      call_id: callId,
      user_id: user.id,
      is_muted: false,
      is_camera_off: false
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

// Notify workspace by posting a system-like message in #general
export async function notifyCallStart(accessToken: string, workspaceId: string, callUrl: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Find #general channel for the workspace
  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('name', 'general')
    .maybeSingle()

  if (!channel) {
    return { error: 'General channel not found', data: null }
  }

  // Post a message so all members see the call notification
  const content = `${user.email || 'Someone'} started a call. Join here: ${callUrl}`

  const { error: msgError } = await supabase
    .from('messages')
    .insert({
      channel_id: channel.id,
      sender_id: user.id,
      content,
    })

  if (msgError) {
    return { error: msgError.message, data: null }
  }

  return { data: true, error: null }
}

export async function leaveCall(accessToken: string, callId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Remove from participants
  const { error } = await supabase
    .from('call_participants')
    .delete()
    .eq('call_id', callId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message, data: null }
  }

  // Check if call is empty and end it
  const { data: participants } = await supabase
    .from('call_participants')
    .select('id')
    .eq('call_id', callId)

  if (!participants || participants.length === 0) {
    await supabase
      .from('calls')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', callId)
  }

  revalidatePath('/call')
  return { data: null, error: null }
}

export async function updateParticipantMedia(
  accessToken: string,
  callId: string,
  isMuted: boolean,
  isCameraOff: boolean
) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const { error } = await supabase
    .from('call_participants')
    .update({
      is_muted: isMuted,
      is_camera_off: isCameraOff
    })
    .eq('call_id', callId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message, data: null }
  }

  return { data: null, error: null }
}

export async function getCallParticipants(accessToken: string, callId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const { data: participants, error } = await supabase
    .from('call_participants')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        email,
        avatar_url
      )
    `)
    .eq('call_id', callId)

  if (error) {
    return { error: error.message, data: null }
  }

  // Format participants
  const formatted = participants?.map(p => ({
    id: p.user_id,
    name: p.profiles?.username || p.profiles?.email?.split('@')[0] || 'Unknown',
    avatar: p.profiles?.username?.[0]?.toUpperCase() || p.profiles?.email?.[0]?.toUpperCase() || 'U',
    isMuted: p.is_muted,
    isCameraOff: p.is_camera_off,
    joinedAt: p.joined_at
  }))

  return { data: formatted || [], error: null }
}
