'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMessages(channelId: string, limit: number = 50) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
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
    .select(`
      *,
      profiles:sender_id(id, username, email, avatar_url)
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    return { error: error.message, data: null }
  }

  // Format messages
  const formattedMessages = messages?.map(message => ({
    id: message.id,
    content: message.content,
    timestamp: message.created_at,
    senderId: message.sender_id,
    channelId: message.channel_id,
    threadId: message.thread_id,
    user: message.profiles?.username || 'Unknown',
    avatar: message.profiles?.avatar_url || (message.profiles?.username?.[0]?.toUpperCase() || 'U'),
  })) || []

  return { data: formattedMessages, error: null }
}

export async function sendMessage(channelId: string, content: string, threadId: string | null = null) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
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
    .select(`
      *,
      profiles:sender_id(id, username, email, avatar_url)
    `)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  // Format response
  const formattedMessage = {
    id: message.id,
    content: message.content,
    timestamp: message.created_at,
    senderId: message.sender_id,
    channelId: message.channel_id,
    threadId: message.thread_id,
    user: message.profiles?.username || 'Unknown',
    avatar: message.profiles?.avatar_url || (message.profiles?.username?.[0]?.toUpperCase() || 'U'),
  }

  revalidatePath(`/chat/${channelId}`)
  return { data: formattedMessage, error: null }
}

export async function getMessageReactions(messageId: string) {
  const supabase = await createClient()

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

export async function addReaction(messageId: string, emoji: string) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
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
    // If already exists, that's okay (idempotent)
    if (error.code === '23505') {
      return { data: null, error: null }
    }
    return { error: error.message, data: null }
  }

  revalidatePath(`/chat`)
  return { data, error: null }
}
