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
            // Set in cookie store
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
            // Create new response and set cookies in it
            response = NextResponse.json({ success: false })
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                httpOnly: options?.httpOnly ?? true,
                secure: options?.secure ?? (process.env.NODE_ENV === 'production'),
                sameSite: options?.sameSite ?? 'lax',
                path: options?.path ?? '/',
                // Use maxAge from options or default to 7 days
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

    // Update response with success - cookies are already set by Supabase SSR in setAll
    const successResponse = NextResponse.json({ 
      success: true, 
      user: { id: data.user.id, email: data.user.email } 
    })

    // Copy all cookies from the response (which were set by Supabase SSR)
    response.cookies.getAll().forEach(cookie => {
      successResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    })

    console.log('[API login] Session created, cookies set:', {
      cookieCount: response.cookies.getAll().length,
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
