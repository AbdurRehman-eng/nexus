import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#6B1212] via-[#4A0808] to-[#2D0505] text-white py-16 sm:py-20 md:py-24 relative overflow-hidden">
          {/* Decorative blue orbs */}
          <div className="absolute top-10 right-10 w-40 h-40 bg-[#3A506B] rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-[#1C2143] rounded-full blur-3xl opacity-20"></div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              About NEXUS
            </h1>
            <p className="text-lg sm:text-xl text-red-100 max-w-2xl mx-auto">
              Building the future of team collaboration
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 sm:py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8 text-center">
              At NEXUS, we believe that effective collaboration should be simple, powerful, and accessible to everyone. 
              Our mission is to provide teams with the tools they need to communicate seamlessly, work efficiently, 
              and achieve their goals together.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Innovation</h3>
                <p className="text-gray-600">Constantly pushing boundaries to deliver cutting-edge collaboration tools.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Collaboration</h3>
                <p className="text-gray-600">Making teamwork effortless and productive for teams of all sizes.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#3A506B] to-[#1C2143] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Trust</h3>
                <p className="text-gray-600">Your data security and privacy are our top priorities.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Join Us Today
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Experience the future of team collaboration with NEXUS.
            </p>
            <Link href="/register" className="btn-primary text-lg px-8 py-4 inline-block">
              Get Started Free →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
