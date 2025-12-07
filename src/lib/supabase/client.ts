import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie.split('; ').map(cookie => {
            const [name, ...rest] = cookie.split('=')
            return { name: name.trim(), value: decodeURIComponent(rest.join('=')) }
          }).filter(c => c.name && c.value)
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Build cookie string
            let cookieString = `${name}=${encodeURIComponent(value)}`
            
            if (options?.path) {
              cookieString += `; path=${options.path}`
            } else {
              cookieString += `; path=/`
            }
            
            if (options?.maxAge) {
              cookieString += `; max-age=${options.maxAge}`
            } else if (options?.expires) {
              cookieString += `; expires=${options.expires}`
            }
            
            if (options?.sameSite) {
              cookieString += `; samesite=${options.sameSite}`
            } else {
              cookieString += `; samesite=lax`
            }
            
            if (options?.secure || process.env.NODE_ENV === 'production') {
              cookieString += `; secure`
            }
            
            // Note: httpOnly cookies cannot be set from JavaScript
            // They must be set by the server
            
            document.cookie = cookieString
          })
        },
      },
    }
  )
}
