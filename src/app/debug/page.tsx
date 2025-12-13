'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugPage() {
  const [clientAuth, setClientAuth] = useState<any>(null);
  const [serverAuth, setServerAuth] = useState<any>(null);
  const [cookies, setCookies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check client-side auth
        const supabase = createClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        setClientAuth({
          session: {
            hasSession: !!session,
            userId: session?.user?.id,
            email: session?.user?.email,
            expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
            error: sessionError?.message,
          },
          user: {
            hasUser: !!user,
            userId: user?.id,
            email: user?.email,
            emailConfirmed: user?.email_confirmed_at,
            error: userError?.message,
          },
        });

        // Check cookies
        const allCookies = document.cookie.split(';').map(c => c.trim());
        const supabaseCookies = allCookies.filter(c => c.startsWith('sb-'));
        setCookies(supabaseCookies);

        // Check server-side auth
        const response = await fetch('/api/debug-auth');
        const serverData = await response.json();
        setServerAuth(serverData);

      } catch (error) {
        console.error('Debug error:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading diagnostic data...</div>
      </div>
    );
  }

  const projectRef = serverAuth?.environment?.projectRef;
  const correctProject = cookies.some(c => c.includes(projectRef));
  const wrongProject = cookies.some(c => c.startsWith('sb-') && !c.includes(projectRef));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Diagnostic</h1>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="space-y-2">
            <StatusItem 
              label="Client has session" 
              status={clientAuth?.session?.hasSession}
            />
            <StatusItem 
              label="Server can authenticate" 
              status={serverAuth?.auth?.getUser?.hasUser}
            />
            <StatusItem 
              label="Cookies present" 
              status={cookies.length > 0}
            />
            <StatusItem 
              label="Correct project cookies" 
              status={correctProject}
            />
            <StatusItem 
              label="Wrong project cookies" 
              status={wrongProject}
              invert
            />
          </div>

          {/* Main Issue */}
          {!serverAuth?.auth?.getUser?.hasUser && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-semibold text-red-800 mb-2">❌ Authentication Issue Detected</h3>
              <p className="text-red-700">
                Error: {serverAuth?.auth?.getUser?.error || 'Unknown error'}
              </p>
              {wrongProject && (
                <p className="text-red-700 mt-2">
                  ⚠️ You have cookies from a different Supabase project. This is likely causing the issue.
                </p>
              )}
            </div>
          )}

          {serverAuth?.auth?.getUser?.hasUser && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-semibold text-green-800">✅ Authentication Working</h3>
              <p className="text-green-700">
                Logged in as: {serverAuth.auth.getUser.email}
              </p>
            </div>
          )}
        </div>

        {/* Client Auth */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Client-Side Authentication</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(clientAuth, null, 2)}
          </pre>
        </div>

        {/* Server Auth */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Server-Side Authentication</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(serverAuth?.auth, null, 2)}
          </pre>
        </div>

        {/* Cookies */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cookies</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Expected project: <span className="font-mono font-semibold">{projectRef}</span>
            </p>
            {cookies.length === 0 ? (
              <p className="text-red-600">No Supabase cookies found</p>
            ) : (
              <ul className="space-y-1">
                {cookies.map((cookie, i) => {
                  const isCorrectProject = cookie.includes(projectRef);
                  return (
                    <li 
                      key={i} 
                      className={`font-mono text-sm ${isCorrectProject ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {isCorrectProject ? '✓' : '✗'} {cookie.split('=')[0]}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Environment */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(serverAuth?.environment, null, 2)}
          </pre>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
            >
              Refresh Diagnostic
            </button>
            <button
              onClick={() => {
                document.cookie.split(";").forEach(c => {
                  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
                localStorage.clear();
                sessionStorage.clear();
                alert('Cookies cleared! Close and reopen browser, then login again.');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-2"
            >
              Clear All Cookies
            </button>
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, status, invert = false }: { label: string; status: boolean; invert?: boolean }) {
  const isGood = invert ? !status : status;
  return (
    <div className="flex items-center justify-between py-2 border-b">
      <span className="text-gray-700">{label}</span>
      <span className={`font-semibold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
        {isGood ? '✓ Yes' : '✗ No'}
      </span>
    </div>
  );
}
