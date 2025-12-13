'use server'

import { createClient } from '@supabase/supabase-js'

// Helper to create admin client for server-side operations
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

export async function getChannelMembers(accessToken: string, channelId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Get channel info
  const { data: channel } = await supabase
    .from('channels')
    .select('is_private')
    .eq('id', channelId)
    .single()

  if (!channel) {
    return { error: 'Channel not found', data: null }
  }

  // If private channel, verify user is a member
  if (channel.is_private) {
    const { data: membership } = await supabase
      .from('channel_members')
      .select('*')
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return { error: 'Not a channel member', data: null }
    }
  }

  // Get all members with their profile info
  const { data: members, error } = await supabase
    .from('channel_members')
    .select(`
      user_id,
      joined_at,
      profiles:user_id(id, username, email, avatar_url)
    `)
    .eq('channel_id', channelId)
    .order('joined_at', { ascending: true })

  if (error) {
    return { error: error.message, data: null }
  }

  // Format the response
  const formattedMembers = members?.map(member => ({
    userId: member.user_id,
    username: member.profiles?.username || 'Unknown',
    email: member.profiles?.email || '',
    avatarUrl: member.profiles?.avatar_url || null,
    joinedAt: member.joined_at,
  })) || []

  return { data: formattedMembers, error: null }
}

export async function addChannelMember(accessToken: string, channelId: string, userId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Get channel and verify it's private (can only manually add to private channels)
  const { data: channel } = await supabase
    .from('channels')
    .select('workspace_id, is_private')
    .eq('id', channelId)
    .single()

  if (!channel) {
    return { error: 'Channel not found', data: null }
  }

  if (!channel.is_private) {
    return { error: 'Cannot manually add members to public channels', data: null }
  }

  // Verify requester is a channel member (only members can add others)
  const { data: requesterMembership } = await supabase
    .from('channel_members')
    .select('*')
    .eq('channel_id', channelId)
    .eq('user_id', user.id)
    .single()

  if (!requesterMembership) {
    return { error: 'You are not a member of this channel', data: null }
  }

  // Verify target user is a workspace member
  const { data: workspaceMember } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', channel.workspace_id)
    .eq('user_id', userId)
    .single()

  if (!workspaceMember) {
    return { error: 'User is not a workspace member', data: null }
  }

  // Add user to channel
  const { data: newMember, error } = await supabase
    .from('channel_members')
    .insert({
      channel_id: channelId,
      user_id: userId,
    })
    .select()
    .single()

  if (error) {
    // If already exists, that's okay
    if (error.code === '23505') {
      return { data: null, error: null }
    }
    return { error: error.message, data: null }
  }

  return { data: newMember, error: null }
}

export async function removeChannelMember(accessToken: string, channelId: string, userId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Get channel info
  const { data: channel } = await supabase
    .from('channels')
    .select('is_private, created_by')
    .eq('id', channelId)
    .single()

  if (!channel) {
    return { error: 'Channel not found', data: null }
  }

  // Can only remove from private channels
  if (!channel.is_private) {
    return { error: 'Cannot remove members from public channels', data: null }
  }

  // Only channel creator or the user themselves can remove
  if (user.id !== channel.created_by && user.id !== userId) {
    return { error: 'Only channel creator can remove other members', data: null }
  }

  // Remove the member
  const { error } = await supabase
    .from('channel_members')
    .delete()
    .eq('channel_id', channelId)
    .eq('user_id', userId)

  if (error) {
    return { error: error.message, data: null }
  }

  return { data: null, error: null }
}
