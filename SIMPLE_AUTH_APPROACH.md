# Simple Auth Approach (Without SSR Complexity)

## The Idea

Instead of fighting with SSR cookies:
1. Use **client-side auth only** (simple Supabase client)
2. Store session in **localStorage** (no cookies!)
3. Pass **access token** to server actions manually
4. Server validates token on each request

## Benefits

- ✅ No cookie issues
- ✅ No SSR complexity
- ✅ Still secure (server validates JWT)
- ✅ Much simpler code
- ✅ No version compatibility issues

## Implementation

### 1. Simplified Client (`src/lib/supabase/client.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

export function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storage: window?.localStorage, // Use localStorage, not cookies
      }
    }
  )
}
```

### 2. No Server Client Needed

Delete `src/lib/supabase/server.ts` - don't need it!

### 3. Login (Still Client-Side)

```typescript
// In login page
const supabase = getSupabaseClient()
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

if (!error) {
  router.push('/homepage')
}
```

### 4. Server Actions (Validate Token)

```typescript
// src/app/actions/workspaces.ts
'use server'

import { createClient } from '@supabase/supabase-js'

export async function getWorkspaces(accessToken: string) {
  // Create admin client for server-side validation
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Set the auth token
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  
  if (error || !user) {
    return { error: 'Not authenticated', data: null }
  }
  
  // Now fetch workspaces with validated user
  const { data: workspaces, error: fetchError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', user.id)
  
  return { data: workspaces, error: fetchError?.message }
}
```

### 5. Homepage (Pass Token)

```typescript
// src/app/homepage/page.tsx
const loadWorkspaces = async () => {
  const supabase = getSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    router.push('/login')
    return
  }
  
  // Pass the access token to server action
  const result = await getWorkspaces(session.access_token)
  
  if (result.error) {
    // Handle error
  } else {
    setWorkspaces(result.data)
  }
}
```

### 6. No Middleware Needed

Delete `src/middleware.ts` - handle auth in each page/component instead.

Or keep minimal middleware for logging:

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  // Just let everything through, handle auth client-side
  return NextResponse.next()
}
```

## Complete Example Files

### `src/lib/supabase/client.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

export function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `src/app/login/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = getSupabaseClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    } else {
      router.push('/homepage')
    }
  }

  return (
    // ... your form JSX
  )
}
```

### `src/app/actions/workspaces.ts`
```typescript
'use server'

import { createClient } from '@supabase/supabase-js'

export async function getWorkspaces(accessToken: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Validate token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  
  if (authError || !user) {
    return { error: 'Not authenticated', data: null }
  }
  
  // Fetch workspaces
  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner(user_id, role)
    `)
    .eq('workspace_members.user_id', user.id)
  
  return { data, error: error?.message }
}
```

### `src/app/homepage/page.tsx`
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { getWorkspaces } from '@/app/actions/workspaces'

export default function Homepage() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    const supabase = getSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }
    
    // Pass token to server action
    const result = await getWorkspaces(session.access_token)
    
    if (result.error === 'Not authenticated') {
      router.push('/login')
    } else if (!result.error) {
      setWorkspaces(result.data || [])
    }
    
    setLoading(false)
  }

  return (
    // ... your JSX
  )
}
```

## Migration Steps

1. **Uninstall SSR package**:
   ```bash
   npm uninstall @supabase/ssr
   ```

2. **Keep only supabase-js**:
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Replace files**:
   - Update `src/lib/supabase/client.ts`
   - Delete `src/lib/supabase/server.ts`
   - Delete or simplify `src/middleware.ts`
   - Update all server actions to accept `accessToken` param
   - Update all pages to pass token

4. **Clear old cookies**:
   - Visit `/clear-auth`
   - Or manually clear

5. **Test**:
   - Login
   - Should work immediately, no cookie issues!

## Security Notes

- ✅ Still secure - server validates JWT on each request
- ✅ Token is signed by Supabase, can't be forged
- ✅ Token expires automatically (1 hour)
- ⚠️ Token visible in client code (but that's okay, it's designed for this)
- ⚠️ Use HTTPS in production

## Comparison

### SSR Approach (Current)
```typescript
// Client: sets cookie
await supabase.auth.signInWithPassword(...)

// Server: reads cookie (COMPLICATED!)
const supabase = await createClient() // reads from cookies
const user = await supabase.auth.getUser()
```

### Simple Approach (Proposed)
```typescript
// Client: gets token
const { session } = await supabase.auth.getSession()

// Server: validates token (SIMPLE!)
const user = await supabase.auth.getUser(session.access_token)
```

## Conclusion

The simple approach:
- ✅ **Same security** (server still validates)
- ✅ **Much simpler** (no cookie management)
- ✅ **More reliable** (no SSR compatibility issues)
- ✅ **Easier to debug** (explicit token passing)

**Recommendation**: If SSR continues to be problematic, switch to this approach. It's what most Supabase apps use anyway!
