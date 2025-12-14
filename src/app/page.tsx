'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  const router = useRouter();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    // Check if we have OAuth tokens in the URL hash (fallback handler)
    const handleOAuthCallback = async () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      
      // Check if we have access_token in hash (OAuth callback)
      if (hash && hash.includes('access_token=')) {
        console.log('[Landing Page] OAuth tokens detected in URL, processing...');
        setIsProcessingAuth(true);

        try {
          const supabase = createClient();
          
          // Parse hash fragments
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            console.log('[Landing Page] Setting session from OAuth tokens');
            
            // Set the session
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (error) {
              console.error('[Landing Page] Failed to set session:', error);
              // Clear hash and show error
              window.location.hash = '';
              alert('Failed to complete sign in. Please try again.');
              setIsProcessingAuth(false);
              return;
            }
            
            if (data.session) {
              console.log('[Landing Page] ✅ Session set successfully, redirecting to homepage');
              // Clear the hash before redirecting
              window.history.replaceState(null, '', window.location.pathname);
              router.push('/homepage');
              return;
            }
          }
        } catch (err) {
          console.error('[Landing Page] Error processing OAuth callback:', err);
          setIsProcessingAuth(false);
        }
      }
    };

    handleOAuthCallback();
  }, [router]);

  // Show loading state if processing OAuth
  if (isProcessingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-dark-red mb-4"></div>
          <p className="text-gray-600 text-lg">Completing sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-20 md:py-32 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-dark-red mb-4 sm:mb-6 px-4">
          WORK SMARTER, NOT HARDER
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
          Chat, share and work together — all on one AI-powered space.
        </p>
        
        <Link href="/register" className="btn-primary text-base sm:text-lg inline-block">
          Get Started
        </Link>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16 md:mt-24">
          <div className="card text-left">
            <div className="w-12 h-12 bg-dark-red rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
            <p className="text-gray-600">Connect instantly with your team through channels and direct messages.</p>
          </div>

          <div className="card text-left">
            <div className="w-12 h-12 bg-dark-red rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Video Calls</h3>
            <p className="text-gray-600">Face-to-face meetings with screen sharing and collaboration tools.</p>
          </div>

          <div className="card text-left">
            <div className="w-12 h-12 bg-dark-red rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Search</h3>
            <p className="text-gray-600">Intelligent search powered by AI to find exactly what you need.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

