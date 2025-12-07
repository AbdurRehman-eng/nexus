import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Ensure cookies are set with proper options for persistence
              cookieStore.set(name, value, {
                ...options,
                httpOnly: options?.httpOnly ?? true,
                secure: options?.secure ?? (process.env.NODE_ENV === 'production'),
                sameSite: options?.sameSite ?? 'lax',
                path: options?.path ?? '/',
                // Set maxAge if not provided to ensure cookies persist
                maxAge: options?.maxAge ?? (options?.expires ? undefined : 60 * 60 * 24 * 7), // 7 days default
              })
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
