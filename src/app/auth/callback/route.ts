import { NextResponse } from 'next/server'

/**
 * OAuth callback handler (Server-side)
 * This route primarily serves the client-side handler
 * The actual token processing happens client-side to handle both PKCE and implicit flows
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin

  console.log('[OAuth Callback Route] Serving client-side callback handler')

  // Return a simple HTML page that includes the client component
  // This allows the client to access both query params and hash fragments
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Completing Sign In...</title>
        <script>
          // Immediately redirect to the client page with full URL (including hash)
          window.location.href = '${origin}/auth/callback/complete' + window.location.search + window.location.hash;
        </script>
      </head>
      <body>
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif;">
          <div style="text-align: center;">
            <div style="display: inline-block; width: 48px; height: 48px; border: 4px solid #f3f4f6; border-top-color: #5A0F0F; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
            <p style="color: #6b7280; font-size: 18px;">Completing sign in...</p>
          </div>
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </body>
    </html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    }
  )
}
