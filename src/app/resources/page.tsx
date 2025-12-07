import Navbar from '@/components/Navbar';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-8 py-16">
        <h1 className="text-5xl font-bold text-dark-red mb-8">Resources</h1>
        <p className="text-xl text-gray-700">
          Access helpful resources, guides, and documentation for NEXUS.
        </p>
      </main>
    </div>
  );
}
