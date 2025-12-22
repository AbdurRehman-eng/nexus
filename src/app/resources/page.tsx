import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#6B1212] via-[#4A0808] to-[#2D0505] text-white py-16 sm:py-20 md:py-24 relative overflow-hidden">
          {/* Decorative blue orbs */}
          <div className="absolute top-10 left-10 w-40 h-40 bg-[#3A506B] rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#1C2143] rounded-full blur-3xl opacity-20"></div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Resources & Documentation
            </h1>
            <p className="text-lg sm:text-xl text-red-100 max-w-2xl mx-auto">
              Everything you need to get the most out of NEXUS
            </p>
          </div>
        </section>

        {/* Resources Grid */}
        <section className="py-16 sm:py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Getting Started */}
              <div className="card hover:shadow-lg transition-shadow hover:border-[#3A506B]">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Getting Started Guide
                </h3>
                <p className="text-gray-600 mb-4">
                  Learn the basics of setting up your workspace and inviting
                  team members.
                </p>
                <Link
                  href="/register"
                  className="text-[#1C2143] font-semibold hover:underline"
                >
                  Start Now →
                </Link>
              </div>

              {/* Video Tutorials */}
              <div className="card hover:shadow-lg transition-shadow hover:border-[#3A506B]">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
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
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Video Tutorials
                </h3>
                <p className="text-gray-600 mb-4">
                  Watch step-by-step video guides on how to use NEXUS features
                  effectively.
                </p>
                <span className="text-gray-500 font-semibold">Coming Soon</span>
              </div>

              {/* Best Practices */}
              <div className="card hover:shadow-lg transition-shadow hover:border-[#3A506B]">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Best Practices
                </h3>
                <p className="text-gray-600 mb-4">
                  Tips and tricks for maximizing team productivity with NEXUS.
                </p>
                <span className="text-gray-500 font-semibold">Coming Soon</span>
              </div>

              {/* API Documentation */}
              <div className="card hover:shadow-lg transition-shadow hover:border-[#3A506B]">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  API Documentation
                </h3>
                <p className="text-gray-600 mb-4">
                  Build custom integrations with our comprehensive API.
                </p>
                <span className="text-gray-500 font-semibold">Coming Soon</span>
              </div>

              {/* Security Guide */}
              <div className="card hover:shadow-lg transition-shadow hover:border-[#3A506B]">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
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
                  Security Guide
                </h3>
                <p className="text-gray-600 mb-4">
                  Learn about our security features and data protection
                  policies.
                </p>
                <span className="text-gray-500 font-semibold">Coming Soon</span>
              </div>

              {/* FAQs */}
              <div className="card hover:shadow-lg transition-shadow hover:border-[#3A506B]">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">FAQs</h3>
                <p className="text-gray-600 mb-4">
                  Find answers to commonly asked questions about NEXUS.
                </p>
                <Link
                  href="/contact"
                  className="text-[#1C2143] font-semibold hover:underline"
                >
                  Ask a Question →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Need Help?
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Our support team is here to help you get started and answer any
              questions.
            </p>
            <Link
              href="/contact"
              className="btn-primary text-lg px-8 py-4 inline-block"
            >
              Contact Support →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
