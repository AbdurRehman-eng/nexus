'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearAuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Clearing...');

  useEffect(() => {
    try {
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        const name = c.trim().split('=')[0];
        // Clear with all possible path/domain combinations
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
      });

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear any IndexedDB (Supabase might use it)
      if (window.indexedDB) {
        indexedDB.databases().then((dbs) => {
          dbs.forEach((db) => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        }).catch(() => {
          // IndexedDB might not be available
        });
      }

      setStatus('✅ Cleared! Redirecting to login...');
      
      // Wait a bit then redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

    } catch (error) {
      console.error('Error clearing auth:', error);
      setStatus('❌ Error clearing auth. Please manually clear cookies.');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 mx-auto text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Clearing Authentication Data</h1>
        <p className="text-gray-600 mb-4">{status}</p>
        <div className="text-sm text-gray-500">
          <p>Removing:</p>
          <ul className="mt-2 text-left list-disc list-inside">
            <li>All cookies</li>
            <li>Local storage</li>
            <li>Session storage</li>
            <li>IndexedDB</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
