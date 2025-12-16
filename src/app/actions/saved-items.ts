'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

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

export async function getSavedItems(accessToken: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // First, load saved items with related message and channel.
  // Note: we can't join directly to profiles here because there's no direct FK
  // between messages.sender_id and profiles.id in Supabase's relationship cache.
  const { data: rawSavedItems, error } = await supabase
    .from('saved_items')
    .select(`
      id,
      user_id,
      message_id,
      created_at,
      message:messages(
        id,
        content,
        created_at,
        channel_id,
        sender_id,
        channel:channels(id, name, workspace_id)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  const savedItems = rawSavedItems || []

  // Collect unique sender IDs from messages
  const senderIds = [
    ...new Set(
      savedItems
        .map((item: any) => item.message?.sender_id)
        .filter((id: string | null | undefined) => !!id)
    )
  ] as string[]

  let profilesMap = new Map<string, any>()

  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, email, avatar_url')
      .in('id', senderIds)

    profilesMap = new Map((profiles || []).map(p => [p.id, p]))
  }

  // Attach sender profile to each message as message.sender
  const enrichedSavedItems = savedItems.map((item: any) => {
    const msg = item.message
    if (!msg) return item

    const profile = profilesMap.get(msg.sender_id)

    return {
      ...item,
      message: {
        ...msg,
        sender: profile || null,
      },
    }
  })

  return { data: enrichedSavedItems, error: null }
}

export async function saveMessage(accessToken: string, messageId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('message_id', messageId)
    .single()

  if (existing) {
    return { error: 'Message already saved', data: null }
  }

  const { data: savedItem, error } = await supabase
    .from('saved_items')
    .insert({
      user_id: user.id,
      message_id: messageId
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath('/chat')
  return { data: savedItem, error: null }
}

export async function unsaveMessage(accessToken: string, messageId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const { error } = await supabase
    .from('saved_items')
    .delete()
    .eq('user_id', user.id)
    .eq('message_id', messageId)

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath('/chat')
  return { data: null, error: null }
}

export async function isMessageSaved(accessToken: string, messageId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: false }
  }

  const { data, error } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('message_id', messageId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    return { error: error.message, data: false }
  }

  return { data: !!data, error: null }
}
