import Navbar from '@/components/Navbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-8 py-16">
        <h1 className="text-5xl font-bold text-dark-red mb-8">About NEXUS</h1>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-dark-red mb-4">Our Mission</h2>
            <p className="text-lg">
              NEXUS is a modern collaboration platform inspired by Slack, designed to bring teams together
              in one unified space. Our mission is to make workplace communication seamless, efficient, and
              enjoyable for teams of all sizes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark-red mb-4">What We Offer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl font-semibold mb-3">Real-time Communication</h3>
                <p>
                  Connect instantly with your team through channels, direct messages, and threaded
                  conversations. Never miss an important update.
                </p>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold mb-3">Video & Audio Calls</h3>
                <p>
                  Start face-to-face meetings with screen sharing capabilities. Collaborate in real-time
                  with your distributed team.
                </p>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold mb-3">AI-Powered Search</h3>
                <p>
                  Find what you need instantly with intelligent search that understands context and
                  delivers relevant results across your workspace.
                </p>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold mb-3">Workspace Management</h3>
                <p>
                  Create and manage multiple workspaces, organize channels, and control access with
                  flexible permissions.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark-red mb-4">Why Choose NEXUS?</h2>
            <ul className="space-y-3 list-disc list-inside text-lg">
              <li>Intuitive and user-friendly interface</li>
              <li>Powerful collaboration tools in one platform</li>
              <li>AI-enhanced productivity features</li>
              <li>Secure and reliable infrastructure</li>
              <li>Scalable for teams of any size</li>
              <li>Continuous innovation and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-dark-red mb-4">Our Story</h2>
            <p className="text-lg">
              NEXUS was created with a vision to revolutionize workplace communication. Inspired by the
              best aspects of modern collaboration tools, we've built a platform that combines real-time
              messaging, video conferencing, and AI-powered search into one seamless experience. Our team
              is committed to continuously improving and adding features that help teams work smarter,
              not harder.
            </p>
          </section>

          <section className="bg-light-gray p-8 rounded-card">
            <h2 className="text-2xl font-semibold text-dark-red mb-4">Join Us Today</h2>
            <p className="text-lg mb-6">
              Ready to transform how your team collaborates? Get started with NEXUS today and experience
              the future of workplace communication.
            </p>
            <a href="/register" className="btn-primary inline-block">
              Get Started Free
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
