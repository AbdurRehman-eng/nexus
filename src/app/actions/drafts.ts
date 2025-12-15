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

export async function getDrafts(accessToken: string, workspaceId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const { data: drafts, error } = await supabase
    .from('message_drafts')
    .select(`
      *,
      channel:channels(id, name),
      workspace:workspaces(id, name)
    `)
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data: drafts || [], error: null }
}

export async function saveDraft(
  accessToken: string,
  workspaceId: string,
  channelId: string | null,
  content: string
) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  if (!content.trim()) {
    // Delete draft if content is empty
    if (channelId) {
      await supabase
        .from('message_drafts')
        .delete()
        .eq('user_id', user.id)
        .eq('channel_id', channelId)
    }
    return { data: null, error: null }
  }

  const { data: draft, error } = await supabase
    .from('message_drafts')
    .upsert({
      user_id: user.id,
      workspace_id: workspaceId,
      channel_id: channelId,
      content: content.trim(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,channel_id'
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath('/chat')
  return { data: draft, error: null }
}

export async function deleteDraft(accessToken: string, draftId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const { error } = await supabase
    .from('message_drafts')
    .delete()
    .eq('id', draftId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath('/chat')
  return { data: null, error: null }
}
