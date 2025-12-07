'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getChannels(workspaceId: string) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Get all channels (RLS will filter based on workspace membership and privacy)
  const { data: channels, error } = await supabase
    .from('channels')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data: channels || [], error: null }
}

export async function createChannel(workspaceId: string, name: string, description: string = '', isPrivate: boolean = false) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Verify user is a workspace member
  const { data: member } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return { error: 'Not a workspace member', data: null }
  }

  const { data: channel, error } = await supabase
    .from('channels')
    .insert({
      workspace_id: workspaceId,
      name,
      description,
      is_private: isPrivate,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  // Add creator as channel member
  await supabase
    .from('channel_members')
    .insert({
      channel_id: channel.id,
      user_id: user.id,
    })

  revalidatePath(`/chat/${workspaceId}`)
  return { data: channel, error: null }
}

export async function getChannel(channelId: string) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const { data: channel, error } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  // Check if user has access
  if (channel.is_private) {
    const { data: member } = await supabase
      .from('channel_members')
      .select('*')
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return { error: 'Access denied', data: null }
    }
  }

  return { data: channel, error: null }
}
