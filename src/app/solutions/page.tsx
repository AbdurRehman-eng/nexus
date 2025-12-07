import Navbar from '@/components/Navbar';

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-8 py-16">
        <h1 className="text-5xl font-bold text-dark-red mb-8">Solutions</h1>
        <p className="text-xl text-gray-700">
          Explore our comprehensive solutions for team collaboration and productivity.
        </p>
      </main>
    </div>
  );
}
