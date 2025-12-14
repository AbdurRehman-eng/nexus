'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Helper to create admin client for server-side operations
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

export async function getProfile(accessToken: string, userId: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Users can view their own profile or any profile (for now)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data: profile, error: null }
}

export async function getCurrentUserProfile(accessToken: string) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data: profile, error: null }
}

export async function updateProfile(
  accessToken: string,
  updates: {
    username?: string
    avatar_url?: string
    display_name?: string
    bio?: string
    phone?: string
    job_title?: string
  }
) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Only allow users to update their own profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath(`/profile/${user.id}`)
  revalidatePath('/profile')
  return { data: profile, error: null }
}
