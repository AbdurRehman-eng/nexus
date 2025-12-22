import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#6B1212] via-[#4A0808] to-[#2D0505] text-white py-16 sm:py-20 relative overflow-hidden">
        {/* Decorative blue orbs */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-[#3A506B] rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-[#1C2143] rounded-full blur-3xl opacity-20"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-white/80">
            Your privacy is important to us
          </p>
        </div>
      </section>

      <main className="flex-grow py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Last Updated Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg mb-8">
            <svg
              className="w-4 h-4 text-[#3A506B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-gray-700">
              <strong>Last Updated:</strong> December 14, 2025
            </span>
          </div>

          <div className="space-y-6">
            <section className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  1. Information We Collect
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We collect information you provide directly to us when you
                create an account, use our services, or communicate with us.
                This may include your name, email address, profile information,
                and any content you create or share through NEXUS.
              </p>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  2. How We Use Your Information
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#3A506B] mt-1">•</span>
                  <span>Provide, maintain, and improve our services</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#3A506B] mt-1">•</span>
                  <span>
                    Process your transactions and send related information
                  </span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#3A506B] mt-1">•</span>
                  <span>Send you technical notices and support messages</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#3A506B] mt-1">•</span>
                  <span>Respond to your comments and questions</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#3A506B] mt-1">•</span>
                  <span>Protect against fraudulent or illegal activity</span>
                </li>
              </ul>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
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
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  3. Data Security
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  4. Your Rights
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                You have the right to access, update, or delete your personal
                information at any time. You can do this through your account
                settings or by contacting us directly.
              </p>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  5. Contact Us
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy, please
                contact us through our contact page.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
