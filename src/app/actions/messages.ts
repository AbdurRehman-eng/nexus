'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

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

export async function getMessages(accessToken: string, channelId: string, limit: number = 50) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Verify user is a channel member
  const { data: member } = await supabase
    .from('channel_members')
    .select('*')
    .eq('channel_id', channelId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return { error: 'Not a channel member', data: null }
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    return { error: error.message, data: null }
  }

  if (!messages || messages.length === 0) {
    return { data: [], error: null }
  }

  // Get unique sender IDs
  const senderIds = [...new Set(messages.map(m => m.sender_id))]

  // Fetch profiles for all senders
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, email, avatar_url')
    .in('id', senderIds)

  // Create a map of user profiles
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  // Format messages with profile data
  const formattedMessages = messages.map(message => {
    const profile = profileMap.get(message.sender_id)
    return {
      id: message.id,
      content: message.content,
      timestamp: message.created_at,
      senderId: message.sender_id,
      channelId: message.channel_id,
      threadId: message.thread_id,
      user: profile?.username || profile?.email?.split('@')[0] || 'Unknown',
      avatar: profile?.avatar_url || (profile?.username?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'),
    }
  })

  return { data: formattedMessages, error: null }
}

export async function sendMessage(accessToken: string, channelId: string, content: string, threadId: string | null = null) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    return { error: 'Message content cannot be empty', data: null }
  }

  if (content.length > 10000) {
    return { error: 'Message content exceeds maximum length (10000 characters)', data: null }
  }

  // Get channel info
  const { data: channel } = await supabase
    .from('channels')
    .select('is_private, workspace_id')
    .eq('id', channelId)
    .single()

  if (!channel) {
    return { error: 'Channel not found', data: null }
  }

  // Verify user is a workspace member
  const { data: workspaceMember } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', channel.workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!workspaceMember) {
    return { error: 'Not a workspace member', data: null }
  }

  // For private channels, verify user is a channel member
  if (channel.is_private) {
    const { data: channelMember } = await supabase
      .from('channel_members')
      .select('*')
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
      .single()

    if (!channelMember) {
      return { error: 'Not a member of this private channel', data: null }
    }
  } else {
    // For public channels, auto-add user as member if not already
    const { data: existingMember } = await supabase
      .from('channel_members')
      .select('*')
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
      .single()

    if (!existingMember) {
      await supabase
        .from('channel_members')
        .insert({
          channel_id: channelId,
          user_id: user.id,
        })
    }
  }

  // If threadId is provided, verify parent message exists and is in same channel
  if (threadId) {
    const { data: parentMessage } = await supabase
      .from('messages')
      .select('channel_id')
      .eq('id', threadId)
      .single()

    if (!parentMessage) {
      return { error: 'Parent message not found', data: null }
    }

    if (parentMessage.channel_id !== channelId) {
      return { error: 'Reply must be in the same channel as parent message', data: null }
    }
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      sender_id: user.id,
      content: content.trim(),
      thread_id: threadId,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  // Fetch sender's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, email, avatar_url')
    .eq('id', user.id)
    .single()

  // Format response
  const formattedMessage = {
    id: message.id,
    content: message.content,
    timestamp: message.created_at,
    senderId: message.sender_id,
    channelId: message.channel_id,
    threadId: message.thread_id,
    user: profile?.username || profile?.email?.split('@')[0] || 'Unknown',
    avatar: profile?.avatar_url || (profile?.username?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'),
  }

  revalidatePath(`/chat/${channelId}`)
  return { data: formattedMessage, error: null }
}

export async function getMessageReactions(accessToken: string, messageId: string) {
  const supabase = getSupabaseAdmin()

  const { data: reactions, error } = await supabase
    .from('message_reactions')
    .select('emoji, user_id')
    .eq('message_id', messageId)

  if (error) {
    return { error: error.message, data: null }
  }

  // Group by emoji
  const grouped = reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction.user_id)
    return acc
  }, {} as Record<string, string[]>) || {}

  // Format as array
  const formatted = Object.entries(grouped).map(([emoji, userIds]) => ({
    emoji,
    count: userIds.length,
    users: userIds,
  }))

  return { data: formatted, error: null }
}

export async function addReaction(accessToken: string, messageId: string, emoji: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Check if user already has a reaction on this message
  const { data: existingReaction } = await supabase
    .from('message_reactions')
    .select('emoji')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .maybeSingle()

  // If user already has a reaction, remove it first (only one reaction allowed per user per message)
  if (existingReaction) {
    await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
  }

  const { data, error } = await supabase
    .from('message_reactions')
    .insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath(`/chat`)
  return { data, error: null }
}

export async function removeReaction(accessToken: string, messageId: string, emoji: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath(`/chat`)
  return { data: null, error: null }
}

export async function editMessage(accessToken: string, messageId: string, newContent: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Validate content
  if (!newContent || newContent.trim().length === 0) {
    return { error: 'Message content cannot be empty', data: null }
  }

  if (newContent.length > 10000) {
    return { error: 'Message content exceeds maximum length (10000 characters)', data: null }
  }

  // Verify message exists and user is the sender
  const { data: message } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('id', messageId)
    .single()

  if (!message) {
    return { error: 'Message not found', data: null }
  }

  if (message.sender_id !== user.id) {
    return { error: 'You can only edit your own messages', data: null }
  }

  // Update message
  const { data: updatedMessage, error } = await supabase
    .from('messages')
    .update({
      content: newContent.trim(),
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath(`/chat`)
  return { data: updatedMessage, error: null }
}

export async function deleteMessage(accessToken: string, messageId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Verify message exists and user is the sender
  const { data: message } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('id', messageId)
    .single()

  if (!message) {
    return { error: 'Message not found', data: null }
  }

  if (message.sender_id !== user.id) {
    return { error: 'You can only delete your own messages', data: null }
  }

  // Soft delete by setting deleted_at
  const { error } = await supabase
    .from('messages')
    .update({
      deleted_at: new Date().toISOString(),
      content: '[Message deleted]',
    })
    .eq('id', messageId)

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath(`/chat`)
  return { data: null, error: null }
}
