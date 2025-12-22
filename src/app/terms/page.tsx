import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-lg text-white/80">
            Please read these terms carefully
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  1. Acceptance of Terms
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using NEXUS, you accept and agree to be bound
                by the terms and provision of this agreement.
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
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  2. Use License
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Permission is granted to temporarily use NEXUS for personal or
                commercial purposes. This is the grant of a license, not a
                transfer of title.
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  3. User Accounts
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                You are responsible for maintaining the confidentiality of your
                account and password. You agree to accept responsibility for all
                activities that occur under your account.
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  4. Acceptable Use
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to use NEXUS:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#3A506B] mt-1">•</span>
                  <span>
                    In any way that violates any applicable law or regulation
                  </span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#3A506B] mt-1">•</span>
                  <span>To transmit any harmful or malicious code</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#3A506B] mt-1">•</span>
                  <span>
                    To impersonate or misrepresent your affiliation with any
                    person or entity
                  </span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-[#3A506B] mt-1">•</span>
                  <span>
                    To interfere with or disrupt the service or servers
                  </span>
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  5. Termination
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your account and bar access to the
                service immediately, without prior notice or liability, under
                our sole discretion, for any reason whatsoever.
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  6. Limitation of Liability
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                In no event shall NEXUS be liable for any indirect, incidental,
                special, consequential or punitive damages, including without
                limitation, loss of profits, data, use, goodwill, or other
                intangible losses.
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  7. Changes to Terms
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify or replace these Terms at any
                time. Your continued use of the service after any such changes
                constitutes your acceptance of the new Terms.
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
                  8. Contact Us
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms, please contact us
                through our contact page.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
