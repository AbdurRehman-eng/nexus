'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SearchResult {
  type: 'message' | 'file' | 'channel';
  title: string;
  content: string;
  author?: string;
  timestamp?: string;
  channel?: string;
}

export default function AISearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    // Simulate AI search
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          type: 'message',
          title: 'Project Update Discussion',
          content: 'The latest updates on the project were shared, including timeline adjustments and new feature requirements.',
          author: 'John Doe',
          timestamp: '2 hours ago',
          channel: '#announcements',
        },
        {
          type: 'file',
          title: 'Q4_Report.pdf',
          content: 'Quarterly financial report containing revenue analysis and growth projections.',
          author: 'Jane Smith',
          timestamp: 'Yesterday',
          channel: '#team-finance',
        },
        {
          type: 'channel',
          title: '#design-team',
          content: 'Channel dedicated to design discussions, mockups, and UI/UX feedback.',
          channel: '#design-team',
        },
      ];
      setResults(mockResults);
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-border px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/homepage" className="text-2xl font-bold text-dark-red">
            NEXUS <span className="text-sm font-normal text-gray-600">by AKD</span>
          </Link>
          <Link href="/homepage" className="text-sm text-gray-700 hover:text-dark-red">
            Back to Home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8">
        {results.length === 0 ? (
          // Initial State - Centered Brain Icon and Search
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            {/* AI Brain Icon */}
            <div className="mb-12">
              <div className="w-32 h-32 bg-gradient-to-br from-dark-red to-maroon rounded-full flex items-center justify-center shadow-custom">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-dark-red mb-4">AI-Powered Search</h1>
            <p className="text-xl text-gray-600 mb-12 text-center max-w-2xl">
              Search across all your workspace data with intelligent AI assistance. Find messages, files, channels, and more.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask me anything about your workspace..."
                  className="w-full px-6 py-4 pr-14 text-lg border-2 border-gray-border rounded-input focus:outline-none focus:ring-2 focus:ring-dark-red focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-dark-red text-white rounded-button hover:bg-maroon transition-colors disabled:opacity-50"
                >
                  {isSearching ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>

            {/* Suggestions */}
            <div className="mt-12 w-full max-w-2xl">
              <p className="text-sm text-gray-500 mb-4">Try asking:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'What were the latest project updates?',
                  'Find all files shared by John',
                  'Show me design discussions',
                  'What meetings are scheduled?',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(suggestion)}
                    className="text-left p-3 border border-gray-border rounded-input hover:border-dark-red hover:bg-light-gray transition-colors"
                  >
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Results State
          <div className="py-12">
            {/* Search Bar at Top */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask me anything about your workspace..."
                  className="w-full px-6 py-4 pr-14 text-lg border-2 border-gray-border rounded-input focus:outline-none focus:ring-2 focus:ring-dark-red focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-dark-red text-white rounded-button hover:bg-maroon transition-colors disabled:opacity-50"
                >
                  {isSearching ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>

            {/* Results */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-dark-red">
                Found {results.length} {results.length === 1 ? 'result' : 'results'}
              </h2>

              {results.map((result, idx) => (
                <div key={idx} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      result.type === 'message' ? 'bg-blue-100 text-blue-600' :
                      result.type === 'file' ? 'bg-green-100 text-green-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {result.type === 'message' && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                      {result.type === 'file' && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                      {result.type === 'channel' && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.title}</h3>
                      <p className="text-gray-700 mb-3">{result.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {result.author && <span>By {result.author}</span>}
                        {result.timestamp && <span>{result.timestamp}</span>}
                        {result.channel && (
                          <span className="text-dark-red font-medium">{result.channel}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
