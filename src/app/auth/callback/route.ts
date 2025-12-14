import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * OAuth callback handler
 * Handles the redirect from OAuth providers (e.g., Google)
 * Exchanges the authorization code for a session and sets cookies
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  console.log('[OAuth Callback] Processing OAuth callback', { 
    hasCode: !!code, 
    hasError: !!error 
  })

  // Handle OAuth errors
  if (error) {
    console.error('[OAuth Callback] OAuth error:', { error, errorDescription })
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    try {
      // Create Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('[OAuth Callback] Failed to exchange code:', exchangeError.message)
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent('Failed to complete sign in. Please try again.')}`
        )
      }

      if (!data.session) {
        console.error('[OAuth Callback] No session returned after code exchange')
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent('Failed to create session. Please try again.')}`
        )
      }

      console.log('[OAuth Callback] ✅ Successfully authenticated user:', {
        userId: data.user.id,
        email: data.user.email,
        provider: data.user.app_metadata.provider
      })

      // Redirect to homepage - the browser will handle localStorage/cookie persistence
      return NextResponse.redirect(`${origin}/homepage`)
    } catch (err) {
      console.error('[OAuth Callback] Unexpected error:', err)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`
      )
    }
  }

  // No code and no error - unexpected state
  console.warn('[OAuth Callback] No code or error provided')
  return NextResponse.redirect(`${origin}/login`)
}
