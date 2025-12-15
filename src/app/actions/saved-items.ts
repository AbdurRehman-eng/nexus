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

  const { data: savedItems, error } = await supabase
    .from('saved_items')
    .select(`
      *,
      message:messages(
        id,
        content,
        created_at,
        channel_id,
        sender_id,
        channel:channels(id, name, workspace_id),
        sender:profiles(id, username, email, avatar_url)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data: savedItems || [], error: null }
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
