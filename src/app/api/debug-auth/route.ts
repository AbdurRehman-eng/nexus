import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check auth status
 * Access at: http://localhost:3000/api/debug-auth
 */
export async function GET(request: Request) {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  // Get Supabase cookies
  const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'))
  
  // Create Supabase client
  const supabase = await createClient()
  
  // Try to get user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Try to get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  // Try to get claims
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      projectRef: process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1],
    },
    cookies: {
      total: allCookies.length,
      allCookieNames: allCookies.map(c => c.name),
      supabaseCookies: supabaseCookies.map(c => ({
        name: c.name,
        valueLength: c.value.length,
        valuePreview: c.value.substring(0, 50) + '...',
        path: c.path,
        domain: c.domain,
        secure: c.secure,
        sameSite: c.sameSite,
      })),
    },
    auth: {
      getUser: {
        hasUser: !!user,
        userId: user?.id,
        email: user?.email,
        emailConfirmed: user?.email_confirmed_at,
        error: userError?.message,
        errorCode: userError?.name,
      },
      getSession: {
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at,
        expiresIn: session?.expires_in,
        error: sessionError?.message,
      },
      getClaims: {
        hasClaims: !!claimsData?.claims,
        userId: claimsData?.claims?.sub,
        email: claimsData?.claims?.email,
        error: claimsError?.message,
      },
    },
    diagnosis: {
      cookiesPresent: supabaseCookies.length > 0,
      correctProject: supabaseCookies.some(c => c.name.includes('jpygbewyjbpphydcjnoy')),
      wrongProject: supabaseCookies.some(c => !c.name.includes('jpygbewyjbpphydcjnoy')),
      canAuthenticate: !!user,
      issue: !user ? (userError?.message || 'Unknown error') : null,
    },
  }
  
  return NextResponse.json(debugInfo, { status: 200 })
}
