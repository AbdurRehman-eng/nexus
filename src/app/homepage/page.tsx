'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getWorkspaces } from '@/app/actions/workspaces';
import { signOut, getSession } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';

interface Workspace {
  id: string;
  name: string;
  owner: string;
  designation: string;
  channelsCount: number;
}

export default function Homepage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait for page to fully load and cookies to be available
    const timer = setTimeout(() => {
      checkAuthAndLoad();
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  const checkAuthAndLoad = async () => {
    setLoading(true);
    setError('');
    
    console.log('[Homepage] Starting auth check...');
    
    // First check client-side session - this is the source of truth
    const supabase = createClient();
    let clientSession = null;
    let retries = 5;
    
    // Wait for session to be available (with retries)
    while (!clientSession && retries > 0) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      clientSession = session;
      
      console.log(`[Homepage] Client session check (attempt ${6 - retries}):`, {
        hasSession: !!session,
        sessionError: sessionError?.message,
        userId: session?.user?.id
      });
      
      if (!clientSession && retries > 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      retries--;
    }
    
    if (!clientSession) {
      console.log('[Homepage] No client session after all retries - redirecting to login');
      window.location.href = '/login';
      return;
    }
    
    console.log('[Homepage] Client session confirmed, waiting for server cookies...');
    // Wait for cookies to propagate to server (important after redirect)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Now try to load workspaces - server action will handle auth check
    console.log('[Homepage] Calling getWorkspaces...');
    let result = await getWorkspaces();
    
    console.log('[Homepage] getWorkspaces result:', {
      hasError: !!result.error,
      error: result.error,
      hasData: !!result.data,
      dataLength: result.data?.length
    });
    
    // If server says not authenticated but we have client session, retry with delays
    if (result.error && result.error === 'Not authenticated') {
      console.log('[Homepage] Server auth failed but client has session - retrying...');
      
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        result = await getWorkspaces();
        console.log(`[Homepage] Retry ${i + 1} result:`, {
          hasError: !!result.error,
          error: result.error
        });
        
        if (!result.error || result.error !== 'Not authenticated') {
          break; // Success or different error
        }
      }
    }
    
    if (result.error && result.error === 'Not authenticated') {
      // Even after retries, server doesn't see session
      // But client has session, so show empty state instead of redirecting
      console.log('[Homepage] Server still says not authenticated, but client has session - showing empty state');
      setError('Unable to load workspaces. Please refresh the page.');
      setWorkspaces([]);
      setLoading(false);
      return;
    } else if (result.error) {
      console.log('[Homepage] Other error:', result.error);
      setError(result.error);
      setLoading(false);
    } else {
      console.log('[Homepage] Success - setting workspaces');
      setWorkspaces(result.data || []);
      setLoading(false);
    }
  };

  const loadWorkspaces = async () => {
    const result = await getWorkspaces();
    
    if (result.error) {
      setError(result.error);
      if (result.error === 'Not authenticated') {
        // Use window.location for full redirect to clear any cached state
        window.location.href = '/login';
        return;
      }
    } else {
      setWorkspaces(result.data || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-light-gray">
      <nav className="bg-white border-b border-gray-border px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-dark-red">
            NEXUS <span className="text-sm font-normal text-gray-600">by AKD</span>
          </Link>
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-700 hover:text-dark-red">Profile</button>
            <button onClick={handleLogout} className="text-sm text-gray-700 hover:text-dark-red">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold text-dark-red mb-2">Hi! Welcome Back</h1>
        <p className="text-gray-600 mb-12">Select a workspace or create a new one to get started.</p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-gray-600">Loading workspaces...</div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-input">
            {error}
          </div>
        ) : workspaces.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-48 h-48 mb-8 flex items-center justify-center">
              <svg className="w-full h-full text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-xl text-gray-600 mb-8">There is no workspace here. Create your own workspace.</p>
            <Link href="/workspace/create" className="btn-primary">
              + Create New Workspace
            </Link>
          </div>
        ) : (
          // Workspaces Grid
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Your Workspaces</h2>
              <Link href="/workspace/create" className="btn-primary">
                + Create New Workspace
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/chat/${workspace.id}`}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-dark-red rounded-lg flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {workspace.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {workspace.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {workspace.owner} • {workspace.designation}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {workspace.channelsCount} {workspace.channelsCount === 1 ? 'channel' : 'channels'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
