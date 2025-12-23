"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getWorkspaces } from "@/app/actions/workspaces";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";

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
  const [error, setError] = useState("");

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setLoading(true);
    setError("");

    // Check client-side session first
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log("[Homepage] No session, redirecting to login");
      router.push("/login");
      return;
    }

    // Pass access token to server action for validation
    const result = await getWorkspaces(session.access_token);

    console.log("[Homepage] getWorkspaces result:", result);

    if (result.error) {
      if (result.error === "Not authenticated") {
        console.error("[Homepage] Authentication failed, redirecting to login");
        router.push("/login");
        return;
      }
      setError(result.error);
    } else {
      console.log("[Homepage] Setting workspaces:", result.data);
      setWorkspaces(result.data || []);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    // Sign out client-side first
    const supabase = createClient();
    await supabase.auth.signOut();

    // Then redirect to login
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#E5E9F0] relative overflow-hidden">
      {/* Wave Pattern at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none">
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#3A506B"
            fillOpacity="1"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,133.3C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
          <path
            fill="#1C2143"
            fillOpacity="0.8"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,208C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>

      <nav className="bg-[#4A0808] border-b border-[#3A506B]/30 px-4 sm:px-6 md:px-8 py-4 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
          >
            <span className="text-white">NEXUS</span>
            <span className="text-xs sm:text-sm font-normal text-[#E5E9F0]">
              by ARD
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/profile"
              className="text-xs sm:text-sm text-[#E5E9F0] hover:text-white px-2 sm:px-0 transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm text-[#E5E9F0] hover:text-white px-2 sm:px-0 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 relative z-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#4A0808] mb-2">
          Hi! Welcome Back
        </h1>
        <p className="text-sm sm:text-base text-[#3A506B] mb-6 sm:mb-8 md:mb-12">
          Select a workspace or create a new one to get started.
        </p>

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
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-24 px-4">
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mb-6 sm:mb-8 flex items-center justify-center">
              {/* 3D Box Icon */}
              <svg
                className="w-full h-full"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="50" y="70" width="100" height="80" fill="#D9D9D9" />
                <path d="M50 70 L100 40 L200 40 L150 70 Z" fill="#3A506B" />
                <path d="M150 70 L200 40 L200 120 L150 150 Z" fill="#1C2143" />
                {/* Spiral decoration */}
                <path
                  d="M100 60 Q105 55, 110 60 T120 60"
                  stroke="#4A0808"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-[#3A506B] mb-6 sm:mb-8 text-center font-medium">
              There is no workspace here. Create your own workspace.
            </p>
            <Link
              href="/workspace/create"
              className="bg-[#4A0808] hover:bg-[#3A506B] text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
            >
              + Create New Workspace
            </Link>
          </div>
        ) : (
          // Workspaces Grid
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-[#1C2143]">
                Your Workspaces
              </h2>
              <Link
                href="/workspace/create"
                className="bg-[#4A0808] hover:bg-[#3A506B] text-white px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 shadow-md text-sm"
              >
                + Create New Workspace
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/chat/${workspace.id}`}
                  className="bg-white border border-[#D9D9D9] rounded-lg p-6 hover:shadow-xl hover:border-[#3A506B] transition-all duration-300 cursor-pointer group hover:-translate-y-1"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#4A0808] to-[#3A506B] rounded-lg flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold flex-shrink-0 group-hover:scale-110 transition-transform">
                      {workspace.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-[#1C2143] truncate group-hover:text-[#4A0808] transition-colors">
                        {workspace.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#3A506B] truncate flex items-center gap-1">
                        <span className="w-2 h-2 bg-[#4A0808] rounded-full"></span>
                        {workspace.owner}
                      </p>
                      <p className="text-xs sm:text-sm text-[#3A506B]/70 mt-1 sm:mt-2">
                        Channels#{workspace.channelsCount}
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
