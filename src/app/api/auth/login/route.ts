import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    let response = NextResponse.json({ success: false })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            console.log('[API login] Supabase wants to set cookies:', cookiesToSet.map(c => c.name))
            // Set in cookie store
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
            // Create new response and set cookies in it
            response = NextResponse.json({ success: false })
            cookiesToSet.forEach(({ name, value, options }) => {
              // Use Supabase's options but ensure proper settings
              response.cookies.set(name, value, {
                ...options,
                httpOnly: options?.httpOnly ?? true,
                secure: options?.secure ?? (process.env.NODE_ENV === 'production'),
                sameSite: (options?.sameSite as any) ?? 'lax',
                path: options?.path ?? '/',
                // Preserve maxAge from Supabase if provided, otherwise use 7 days
                maxAge: options?.maxAge ?? (options?.expires ? undefined : 60 * 60 * 24 * 7),
              })
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Get all cookies that were set by Supabase SSR
    const allCookies = cookieStore.getAll()
    const responseCookies = response.cookies.getAll()
    
    console.log('[API login] Cookies after signIn:', {
      cookieStoreCount: allCookies.length,
      cookieStoreNames: allCookies.map(c => c.name),
      responseCookieCount: responseCookies.length,
      responseCookieNames: responseCookies.map(c => c.name)
    })

    // Create success response
    const successResponse = NextResponse.json({ 
      success: true, 
      user: { id: data.user.id, email: data.user.email } 
    })

    // Copy ALL cookies from response (set by Supabase SSR in setAll)
    // These are the actual auth cookies
    responseCookies.forEach(cookie => {
      successResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    })

    // Also ensure any cookies from cookieStore that aren't in response are added
    allCookies.forEach(cookie => {
      if (!successResponse.cookies.get(cookie.name)) {
        // Only add Supabase-related cookies
        if (cookie.name.includes('supabase') || cookie.name.includes('auth') || cookie.name.includes('sb-')) {
          successResponse.cookies.set(cookie.name, cookie.value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
          })
        }
      }
    })

    console.log('[API login] Final response cookies:', {
      cookieCount: successResponse.cookies.getAll().length,
      cookieNames: successResponse.cookies.getAll().map(c => c.name),
      userId: data.user.id
    })

    return successResponse
  } catch (error) {
    console.error('[API login] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
