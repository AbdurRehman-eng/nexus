'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Helper to create admin client for server-side operations
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Register a new user account
 * Note: Registration is now done client-side.
 * This server action is kept for compatibility but not used.
 */
export async function signUp(email: string, password: string, username?: string) {
  const supabase = getSupabaseAdmin()

  // Validate password length
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long', data: null }
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      data: {
        username: username || email.split('@')[0],
      },
    },
  })

  if (error) {
    return { error: error.message, data: null }
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    return { 
      data: null, 
      error: null,
      requiresConfirmation: true,
      message: 'Please check your email to confirm your account before signing in.'
    }
  }

  // If session exists, return it - the client will handle cookie management
  revalidatePath('/', 'layout')
  revalidatePath('/homepage')
  return { data, error: null, requiresConfirmation: false }
}

/**
 * Sign in with email and password
 * Note: Login is now done client-side.
 * This server action is kept for compatibility but not used.
 */
export async function signIn(email: string, password: string) {
  const supabase = getSupabaseAdmin()

  if (!email || !password) {
    return { error: 'Email and password are required', data: null }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    // Provide more user-friendly error messages
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password', data: null }
    }
    return { error: error.message, data: null }
  }

  // Verify session was created
  if (!data.session) {
    return { error: 'Failed to create session. Please try again.', data: null }
  }

  // Don't call setSession here - it fails silently in Server Actions
  // The client-side code will handle setting the session in the browser
  
  // Revalidate paths to clear cache
  revalidatePath('/', 'layout')
  revalidatePath('/homepage')
  
  return { data, error: null }
}

/**
 * Sign out the current user
 * Clears the session client-side
 */
export async function signOut(accessToken: string) {
  const supabase = getSupabaseAdmin()
  
  // Sign out on server (optional)
  if (accessToken) {
    await supabase.auth.admin.signOut(accessToken)
  }
  
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Sign in with Google OAuth
 * Uses PKCE flow for better security
 */
export async function signInWithGoogle() {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      skipBrowserRedirect: false,
    },
  })

  if (error) {
    return { error: error.message, data: null }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { data, error: null }
}

/**
 * Get the current authenticated user
 */
export async function getUser(accessToken: string) {
  const supabase = getSupabaseAdmin()
  const { data: { user } } = await supabase.auth.getUser(accessToken)
  return user
}
