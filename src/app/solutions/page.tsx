import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#6B1212] via-[#4A0808] to-[#2D0505] text-white py-16 sm:py-20 md:py-24 relative overflow-hidden">
          {/* Decorative blue orbs */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-[#3A506B] rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-[#1C2143] rounded-full blur-3xl opacity-20"></div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Solutions for Every Team
            </h1>
            <p className="text-lg sm:text-xl text-red-100 max-w-2xl mx-auto">
              Whether you're a startup or an enterprise, NEXUS scales with your
              needs
            </p>
          </div>
        </section>

        {/* Solutions Grid */}
        <section className="py-16 sm:py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
              {/* Small Teams */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-8 hover:border-[#3A506B] transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-lg flex items-center justify-center mb-6">
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  For Small Teams
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Perfect for startups and small teams looking to streamline
                  communication and boost productivity.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-[#3A506B] mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">Up to 10 team members</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-[#3A506B] mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">Unlimited channels</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-[#3A506B] mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Video calls & screen sharing
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-[#3A506B] mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      File sharing & storage
                    </span>
                  </li>
                </ul>
                <Link
                  href="/register"
                  className="bg-[#1C2143] hover:bg-[#3A506B] text-white font-semibold px-6 py-3 rounded-button w-full text-center block transition-colors"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Enterprise */}
              <div className="bg-gradient-to-br from-dark-red to-maroon text-white rounded-lg p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-[#3A506B] text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-6">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">For Enterprise</h3>
                <p className="text-red-100 mb-6 leading-relaxed">
                  Advanced features and dedicated support for large
                  organizations with complex needs.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-white">Unlimited team members</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-white">
                      Advanced security & compliance
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-white">Dedicated support team</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-white">
                      Custom integrations & API access
                    </span>
                  </li>
                </ul>
                <Link
                  href="/contact"
                  className="bg-white text-dark-red hover:bg-gray-100 font-semibold px-6 py-3 rounded-button w-full text-center block transition-colors"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
              Key Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">
                  Real-time Messaging
                </h3>
                <p className="text-sm text-gray-600">
                  Instant communication with threaded conversations
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">HD Video Calls</h3>
                <p className="text-sm text-gray-600">
                  Crystal clear video with screen sharing
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">
                  File Management
                </h3>
                <p className="text-sm text-gray-600">
                  Easy file sharing and organization
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Search & AI</h3>
                <p className="text-sm text-gray-600">
                  Intelligent search across all content
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
