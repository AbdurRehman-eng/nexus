"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarBorder from "@/components/StarBorder";
import Threads from "@/components/Threads";

export default function LandingPage() {
  const router = useRouter();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    // Check if we have OAuth tokens in the URL hash (fallback handler)
    const handleOAuthCallback = async () => {
      if (typeof window === "undefined") return;

      const hash = window.location.hash;

      // Check if we have access_token in hash (OAuth callback)
      if (hash && hash.includes("access_token=")) {
        console.log(
          "[Landing Page] OAuth tokens detected in URL, processing..."
        );
        setIsProcessingAuth(true);

        try {
          const supabase = createClient();

          // Parse hash fragments
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken) {
            console.log("[Landing Page] Setting session from OAuth tokens");

            // Set the session
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });

            if (error) {
              console.error("[Landing Page] Failed to set session:", error);
              // Clear hash and show error
              window.location.hash = "";
              alert("Failed to complete sign in. Please try again.");
              setIsProcessingAuth(false);
              return;
            }

            if (data.session) {
              console.log(
                "[Landing Page] ✅ Session set successfully, redirecting to homepage"
              );
              // Clear the hash before redirecting
              window.history.replaceState(null, "", window.location.pathname);
              router.push("/homepage");
              return;
            }
          }
        } catch (err) {
          console.error("[Landing Page] Error processing OAuth callback:", err);
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
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-grow relative overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0505] via-[#3d0f0f] to-[#5A1515]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtMS4xLS45LTItMi0yaC00Yy0xLjEgMC0yIC45LTIgMnY0YzAgMS4xLjkgMiAyIDJoNGMxLjEgMCAyLS45IDItMnYtNHptMCAxOGMwLTEuMS0uOS0yLTItMmgtNGMtMS4xIDAtMiAuOS0yIDJ2NGMwIDEuMS45IDIgMiAyaDRjMS4xIDAgMi0uOSAyLTJ2LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-maroon/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-dark-red/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Threads Background */}
        <div
          style={{
            width: "100%",
            height: "600px",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
            opacity: 0.3,
          }}
        >
          <Threads
            amplitude={1}
            distance={0}
            enableMouseInteraction={true}
            color={[0.8, 0.2, 0.2]}
          />
        </div>

        {/* Content Overlay */}
        <div
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-[20vh] pb-12 sm:pb-16 md:pb-20 text-center"
          style={{ minHeight: "600px" }}
        >
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>Join 10,000+ teams already using Nexus</span>
          </div>

          {/* Main Heading with Gradient Text */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 sm:mb-8 px-4 leading-tight">
            <span className="block text-white mb-2 animate-slide-up">Work</span>
            <span
              className="block bg-clip-text text-transparent bg-gradient-to-r from-red-200 via-red-300 to-red-400 animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              Harder
            </span>
            <span
              className="block text-white/90 text-4xl sm:text-5xl md:text-6xl mt-4 animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              Not Smarter
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-10 sm:mb-12 max-w-3xl mx-auto px-4 leading-relaxed animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            Transform your team's productivity with AI-powered collaboration
            <br />
            <span className="text-gray-300 text-base sm:text-lg">
              All your communication, files, and workflows in one powerful
              platform
            </span>
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <StarBorder
              as="div"
              className="w-full sm:w-auto"
              color="#ffffff"
              speed="6s"
            >
              <Link
                href="/register"
                className="bg-white text-dark-red hover:bg-gray-100 text-base sm:text-lg w-full sm:w-auto px-10 py-5 rounded-button font-bold block text-center transition-all hover:scale-105 shadow-2xl"
              >
                Get Started Free →
              </Link>
            </StarBorder>
            <Link
              href="/contact"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-dark-red text-base sm:text-lg w-full sm:w-auto px-10 py-5 rounded-button font-bold transition-all hover:scale-105"
            >
              Book a Demo
            </Link>
          </div>

          {/* Stats Bar */}
          <div
            className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-16 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                10K+
              </div>
              <div className="text-sm text-gray-300">Active Teams</div>
            </div>
            <div className="text-center border-l border-r border-white/20">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                99.9%
              </div>
              <div className="text-sm text-gray-300">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                500M+
              </div>
              <div className="text-sm text-gray-300">Messages Sent</div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-16 sm:mt-20 md:mt-24 bg-white/5 backdrop-blur-sm p-8 rounded-2xl">
            <div className="group card text-left hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white">
              <div className="w-14 h-14 bg-gradient-to-br from-dark-red to-maroon rounded-lg mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-7 h-7 text-white"
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
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                Real-time Chat
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Connect instantly with your team through organized channels,
                direct messages, and threaded conversations.
              </p>
            </div>

            <div className="group card text-left hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white">
              <div className="w-14 h-14 bg-gradient-to-br from-dark-red to-maroon rounded-lg mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                Video Calls
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Face-to-face meetings with HD video, screen sharing, and
                real-time collaboration tools powered by LiveKit.
              </p>
            </div>

            <div className="group card text-left hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white">
              <div className="w-14 h-14 bg-gradient-to-br from-dark-red to-maroon rounded-lg mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                AI Search
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Find exactly what you need with intelligent search that
                understands context and learns from your workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why NEXUS Section */}
      <section className="bg-gradient-to-br from-dark-red to-maroon py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose NEXUS?
            </h2>
            <p className="text-lg sm:text-xl text-red-100 max-w-2xl mx-auto">
              Everything your team needs to collaborate effectively, all in one
              place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-dark-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Lightning Fast
              </h3>
              <p className="text-gray-600">
                Real-time updates and instant messaging keep your team in sync
                without delays.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-dark-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Enterprise-grade security with end-to-end encryption keeps your
                data safe.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-dark-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Team Workspaces
              </h3>
              <p className="text-gray-600">
                Organize your team into workspaces with custom channels and
                permissions.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-dark-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                File Sharing
              </h3>
              <p className="text-gray-600">
                Share files, images, and documents seamlessly within
                conversations.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-dark-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Mobile Ready
              </h3>
              <p className="text-gray-600">
                Fully responsive design works perfectly on desktop, tablet, and
                mobile devices.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-dark-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Message Reactions
              </h3>
              <p className="text-gray-600">
                Express yourself with emoji reactions and engage in richer
                conversations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Simple setup, powerful collaboration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-dark-red text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Create Account
              </h3>
              <p className="text-gray-600">
                Sign up with email or Google in seconds. No credit card
                required.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-dark-red text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Create Workspace
              </h3>
              <p className="text-gray-600">
                Set up your workspace and invite team members to join.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-dark-red text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Start Collaborating
              </h3>
              <p className="text-gray-600">
                Chat, call, and work together seamlessly in your new workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-dark-red to-maroon py-16 sm:py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Team?
          </h2>
          <p className="text-lg sm:text-xl text-red-100 mb-10 max-w-2xl mx-auto">
            Join thousands of teams already collaborating better with NEXUS.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <StarBorder
              as="div"
              className="w-full sm:w-auto"
              color="#d1d5db"
              speed="6s"
            >
              <Link
                href="/register"
                className="bg-white text-dark-red hover:bg-gray-100 px-8 py-4 rounded-button font-bold text-lg transition-colors w-full sm:w-auto block text-center"
              >
                Get Started Free →
              </Link>
            </StarBorder>
            <Link
              href="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-dark-red px-8 py-4 rounded-button font-bold text-lg transition-colors w-full sm:w-auto"
            >
              Schedule Demo
            </Link>
          </div>
          <p className="text-red-100 text-sm mt-6">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
