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

export async function uploadProfileImage(
  accessToken: string,
  file: { name: string; type: string; size: number; arrayBuffer: ArrayBuffer }
) {
  const supabase = getSupabaseAdmin()

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) {
    return { error: 'Not authenticated', data: null }
  }

  // Validate file size (max 5MB for profile images)
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
  if (file.size > MAX_IMAGE_SIZE) {
    return { error: 'Image size exceeds 5MB limit', data: null }
  }

  // Validate file type (only images)
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: 'Only JPEG, PNG, GIF, and WebP images are allowed', data: null }
  }

  // Delete old profile image if it exists
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  if (currentProfile?.avatar_url) {
    // Extract path from URL if it's from our bucket
    const url = currentProfile.avatar_url
    if (url.includes('/storage/v1/object/public/profile-images/')) {
      const pathMatch = url.match(/profile-images\/(.+)$/)
      if (pathMatch && pathMatch[1]) {
        await supabase.storage
          .from('profile-images')
          .remove([pathMatch[1]])
      }
    }
  }

  // Generate unique file path
  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const filePath = fileName

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file.arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: true // Allow overwriting
    })

  if (uploadError) {
    console.error('[uploadProfileImage] Storage error:', uploadError)
    return { error: `Upload failed: ${uploadError.message}`, data: null }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-images')
    .getPublicUrl(filePath)

  // Update profile with new avatar URL
  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single()

  if (updateError) {
    // Clean up uploaded file if database update fails
    await supabase.storage
      .from('profile-images')
      .remove([filePath])
    
    return { error: updateError.message, data: null }
  }

  revalidatePath('/profile')
  revalidatePath(`/profile/${user.id}`)
  return { data: { url: publicUrl, profile }, error: null }
}
