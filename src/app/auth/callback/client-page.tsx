'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Client-side OAuth callback handler
 * Handles both PKCE flow (query params) and implicit flow (hash fragments)
 */
export default function AuthCallbackClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();
        
        // Check if we have hash fragments (implicit flow)
        if (window.location.hash) {
          console.log('[OAuth Callback Client] Handling implicit flow (hash fragments)');
          
          // Parse hash fragments
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            console.log('[OAuth Callback Client] Setting session from hash fragments');
            
            // Set the session using the tokens
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (sessionError) {
              console.error('[OAuth Callback Client] Failed to set session:', sessionError);
              setError('Failed to complete sign in. Please try again.');
              setLoading(false);
              return;
            }
            
            if (data.session) {
              console.log('[OAuth Callback Client] ✅ Session set successfully, redirecting to homepage');
              router.push('/homepage');
              return;
            }
          }
        }
        
        // Check for query parameters (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');
        
        if (errorParam) {
          console.error('[OAuth Callback Client] OAuth error:', errorParam);
          setError(decodeURIComponent(errorParam));
          setLoading(false);
          return;
        }
        
        if (code) {
          console.log('[OAuth Callback Client] Handling PKCE flow (authorization code)');
          
          // Exchange code for session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('[OAuth Callback Client] Failed to exchange code:', exchangeError);
            setError('Failed to complete sign in. Please try again.');
            setLoading(false);
            return;
          }
          
          if (data.session) {
            console.log('[OAuth Callback Client] ✅ Session created, redirecting to homepage');
            router.push('/homepage');
            return;
          }
        }
        
        // No tokens found
        console.warn('[OAuth Callback Client] No tokens found in URL');
        setError('Authentication failed. No tokens received.');
        setLoading(false);
      } catch (err) {
        console.error('[OAuth Callback Client] Unexpected error:', err);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-dark-red mb-4"></div>
          <p className="text-gray-600 text-lg">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}
