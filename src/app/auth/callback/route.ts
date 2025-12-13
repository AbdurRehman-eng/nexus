import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * OAuth callback handler
 * Handles the redirect from OAuth providers (e.g., Google)
 * Note: OAuth in simple auth approach stores session in localStorage via client redirect
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Failed to complete sign in. Please try again.')}`)
    }
  }

  // Redirect to homepage after successful authentication
  return NextResponse.redirect(`${origin}/homepage`)
}
