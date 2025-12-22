"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchWorkspace } from "@/app/actions/search";
import { createClient } from "@/lib/supabase/client";

interface SearchResult {
  type: "message" | "channel" | "workspace";
  id: string;
  title: string;
  content: string;
  author?: string;
  timestamp?: string;
  channel?: string;
  channelId?: string;
  workspaceId?: string;
}

export default function AISearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setAccessToken(session.access_token);
    };

    checkAuth();
  }, [router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !accessToken) return;

    setIsSearching(true);
    setError("");

    const result = await searchWorkspace(accessToken, searchQuery);

    if (result.error) {
      setError(result.error);
      setResults([]);
    } else {
      setResults(result.data || []);
    }

    setIsSearching(false);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "message" && result.workspaceId) {
      router.push(`/chat/${result.workspaceId}`);
    } else if (result.type === "channel" && result.workspaceId) {
      router.push(`/chat/${result.workspaceId}`);
    } else if (result.type === "workspace" && result.workspaceId) {
      router.push(`/chat/${result.workspaceId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E9F0]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6B1212] to-[#4A0808] px-8 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/homepage" className="text-2xl font-bold text-white">
            NEXUS{" "}
            <span className="text-sm font-normal text-white/70">by AKD</span>
          </Link>
          <Link
            href="/homepage"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-lg border border-white/20 transition-all hover:shadow-lg flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-8">
        {results.length === 0 ? (
          // Initial State - Centered Brain Icon and Search
          <div className="flex flex-col items-center justify-center min-h-[80vh] py-12">
            {/* AI Brain Icon with subtle glow */}
            <div className="mb-10 relative">
              <div className="absolute inset-0 bg-[#3A506B] rounded-full blur-2xl opacity-20"></div>
              <div className="relative w-40 h-40 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-full flex items-center justify-center shadow-2xl">
                <svg
                  className="w-20 h-20 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-[#4A0808] mb-4">
              AI-Powered Search
            </h1>
            <p className="text-xl text-gray-600 mb-12 text-center max-w-2xl">
              Search messages, files or ask anything...
            </p>

            {/* Search Bar Card */}
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages, files or ask anything..."
                    className="w-full pl-14 pr-14 py-4 text-lg bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3A506B] focus:border-[#3A506B] focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-br from-[#3A506B] to-[#1C2143] hover:from-[#1C2143] hover:to-[#3A506B] text-white rounded-lg transition-all disabled:opacity-50 shadow-lg"
                  >
                    {isSearching ? (
                      <svg
                        className="animate-spin w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </form>

              {/* Suggestions */}
              <div className="mt-8">
                <p className="text-sm text-gray-500 mb-4 font-medium">
                  Try searching for:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "project update",
                    "meeting notes",
                    "design files",
                    "team discussion",
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        // Auto-submit
                        setTimeout(() => {
                          if (accessToken) {
                            setIsSearching(true);
                            searchWorkspace(accessToken, suggestion).then(
                              (result) => {
                                if (result.error) {
                                  setError(result.error);
                                  setResults([]);
                                } else {
                                  setResults(result.data || []);
                                }
                                setIsSearching(false);
                              }
                            );
                          }
                        }, 100);
                      }}
                      className="text-left px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-[#3A506B] hover:bg-white hover:shadow-md transition-all"
                    >
                      <span className="text-sm text-gray-700">
                        {suggestion}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Results State
          <div className="py-12">
            {/* Search Bar at Top in Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages, files or ask anything..."
                    className="w-full pl-14 pr-14 py-4 text-lg bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3A506B] focus:border-[#3A506B] focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-br from-[#3A506B] to-[#1C2143] hover:from-[#1C2143] hover:to-[#3A506B] text-white rounded-lg transition-all disabled:opacity-50 shadow-lg"
                  >
                    {isSearching ? (
                      <svg
                        className="animate-spin w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl mb-6 shadow-sm">
                {error}
              </div>
            )}

            {/* Results Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              {/* Header with AI Icon */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#4A0808]">
                    AI-Powered Search
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Found {results.length}{" "}
                    {results.length === 1 ? "result" : "results"}
                  </p>
                </div>
              </div>

              {results.length === 0 && !error ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg">
                    No results found for "{searchQuery}"
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Try different keywords or check your spelling
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full bg-gray-50 hover:bg-white border border-gray-200 hover:border-[#3A506B] rounded-xl p-5 transition-all text-left group hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                            result.type === "message"
                              ? "bg-gradient-to-br from-[#3A506B] to-[#1C2143] text-white"
                              : result.type === "channel"
                              ? "bg-gradient-to-br from-purple-500 to-purple-700 text-white"
                              : "bg-gradient-to-br from-green-500 to-green-700 text-white"
                          }`}
                        >
                          {result.type === "message" && (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                          )}
                          {result.type === "channel" && (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                              />
                            </svg>
                          )}
                          {result.type === "workspace" && (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#3A506B] transition-colors">
                            {result.title}
                          </h3>
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {result.content}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {result.author && <span>By {result.author}</span>}
                            {result.timestamp && (
                              <span>{result.timestamp}</span>
                            )}
                            {result.channel && (
                              <span className="text-[#3A506B] font-medium">
                                {result.channel}
                              </span>
                            )}
                          </div>
                        </div>

                        <svg
                          className="w-5 h-5 text-gray-300 group-hover:text-[#3A506B] flex-shrink-0 mt-1 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
