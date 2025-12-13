import { NextResponse, type NextRequest } from 'next/server'

// Simplified middleware - no SSR auth checking
// Auth is handled client-side and validated in server actions
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
