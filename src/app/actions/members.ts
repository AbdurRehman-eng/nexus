'use server'

import { createClient } from '@supabase/supabase-js'

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

// Get workspace members with online status
export async function getWorkspaceMembers(accessToken: string, workspaceId: string) {
  const supabase = getSupabaseAdmin()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  try {
    // Get workspace members with user details
    const { data: members, error } = await supabase
      .from('workspace_members')
      .select(`
        id,
        user_id,
        workspace_id,
        role,
        created_at,
        profiles!inner (
          id,
          username,
          email,
          avatar_url
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('profiles.username')

    if (error) {
      console.error('Error fetching workspace members:', error)
      return { error: 'Failed to fetch workspace members', data: null }
    }

    // Transform data to include profile information at the top level
    const transformedMembers = members?.map((member: any) => ({
      id: member.id,
      user_id: member.user_id,
      workspace_id: member.workspace_id,
      role: member.role,
      username: member.profiles?.username || member.profiles?.email?.split('@')[0] || 'Unknown',
      email: member.profiles?.email || '',
      avatar_url: member.profiles?.avatar_url || null,
      is_online: true, // For now, assume online. Can be enhanced with presence tracking
    })) || []

    return { data: transformedMembers, error: null }
  } catch (error) {
    console.error('Error in getWorkspaceMembers:', error)
    return { error: 'Failed to fetch workspace members', data: null }
  }
}

// Send direct message
export async function sendDirectMessage(accessToken: string, recipientId: string, content: string) {
  const supabase = getSupabaseAdmin()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  if (!content.trim()) {
    return { error: 'Message content is required', data: null }
  }

  try {
    // For now, we'll store DMs as regular messages in a special DM channel
    // In a production app, you'd want a separate direct_messages table
    
    // Check if DM channel exists between these users
    const channelName = [user.id, recipientId].sort().join('-dm-')
    
    let { data: dmChannel, error: channelError } = await supabase
      .from('channels')
      .select('id')
      .eq('name', channelName)
      .eq('is_private', true)
      .single()

    // Create DM channel if it doesn't exist
    if (!dmChannel) {
      const { data: newChannel, error: createError } = await supabase
        .from('channels')
        .insert([{
          name: channelName,
          description: 'Direct Message Channel',
          is_private: true,
          workspace_id: '00000000-0000-0000-0000-000000000000', // Special DM workspace
          created_by: user.id
        }])
        .select()
        .single()

      if (createError) {
        console.error('Error creating DM channel:', createError)
        return { error: 'Failed to create DM channel', data: null }
      }

      if (!newChannel) {
        return { error: 'Failed to create DM channel', data: null }
      }

      dmChannel = newChannel
    }

    // At this point dmChannel is guaranteed to exist
    if (!dmChannel) {
      return { error: 'DM channel not found', data: null }
    }

    // Send the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert([{
        content: content.trim(),
        channel_id: dmChannel.id,
        sender_id: user.id,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (messageError) {
      console.error('Error sending direct message:', messageError)
      return { error: 'Failed to send direct message', data: null }
    }

    return { data: message, error: null }
  } catch (error) {
    console.error('Error in sendDirectMessage:', error)
    return { error: 'Failed to send direct message', data: null }
  }
}

// Get direct messages between current user and another user
export async function getDirectMessages(accessToken: string, otherUserId: string) {
  const supabase = getSupabaseAdmin()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  try {
    // Find the DM channel between these users
    const channelName = [user.id, otherUserId].sort().join('-dm-')
    
    const { data: dmChannel, error: channelError } = await supabase
      .from('channels')
      .select('id')
      .eq('name', channelName)
      .eq('is_private', true)
      .single()

    if (!dmChannel) {
      return { data: [], error: null } // No DM history yet
    }

    // Get messages from the DM channel
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        profiles!inner (
          username,
          email,
          avatar_url
        )
      `)
      .eq('channel_id', dmChannel.id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching direct messages:', messagesError)
      return { error: 'Failed to fetch direct messages', data: null }
    }

    const transformedMessages = messages?.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      timestamp: new Date(msg.created_at).toISOString(),
      sender_id: msg.sender_id,
      sender_name: msg.profiles?.username || msg.profiles?.email?.split('@')[0] || 'Unknown',
      avatar: msg.profiles?.avatar_url || msg.profiles?.username?.[0]?.toUpperCase() || 'U'
    })) || []

    return { data: transformedMessages, error: null }
  } catch (error) {
    console.error('Error in getDirectMessages:', error)
    return { error: 'Failed to fetch direct messages', data: null }
  }
}