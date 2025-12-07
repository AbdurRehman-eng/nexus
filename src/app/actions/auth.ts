'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signUp(email: string, password: string, username?: string) {
  const supabase = await createClient()

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

  // If session exists, ensure it's properly set
  if (data.session) {
    await supabase.auth.getSession()
  }

  revalidatePath('/', 'layout')
  revalidatePath('/homepage')
  return { data, error: null, requiresConfirmation: false }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

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
    // Allow sign-in without email verification - removed email confirmation check
    return { error: error.message, data: null }
  }

  // Verify session was created
  if (!data.session) {
    console.log('[signIn] No session in response');
    return { error: 'Failed to create session. Please try again.', data: null }
  }

  console.log('[signIn] Session created:', {
    userId: data.session.user.id,
    expiresAt: data.session.expires_at,
    expiresIn: data.session.expires_in
  });

  // Force a session refresh to ensure cookies are set properly
  // This is important for cookie persistence
  const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.getSession()
  
  if (refreshError) {
    console.error('[signIn] Session refresh error:', refreshError);
  }
  
  console.log('[signIn] Session refresh:', {
    hasSession: !!refreshedSession,
    refreshError: refreshError?.message,
    userId: refreshedSession?.user?.id
  });
  
  // Revalidate paths to clear cache
  revalidatePath('/', 'layout')
  revalidatePath('/homepage')
  
  return { data, error: null }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
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

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
