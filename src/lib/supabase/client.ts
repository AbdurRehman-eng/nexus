import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // createBrowserClient automatically handles cookies
  // It will read from document.cookie and can set non-httpOnly cookies
  // httpOnly cookies are set by the server (API routes, middleware)
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
