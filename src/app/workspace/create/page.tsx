'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateWorkspace() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [organizationType, setOrganizationType] = useState<'private' | 'public'>('private');
  const [coworkerEmail, setCoworkerEmail] = useState('');
  const [coworkers, setCoworkers] = useState<string[]>([]);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (workspaceName.trim()) {
      setStep(2);
    }
  };

  const handleAddCoworker = () => {
    if (coworkerEmail.trim() && !coworkers.includes(coworkerEmail)) {
      setCoworkers([...coworkers, coworkerEmail]);
      setCoworkerEmail('');
    }
  };

  const handleRemoveCoworker = (email: string) => {
    setCoworkers(coworkers.filter((c) => c !== email));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just redirect to homepage
    router.push('/homepage');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Instructions */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-red to-maroon text-white p-16 flex-col justify-center">
        {step === 1 ? (
          <>
            <h1 className="text-4xl font-bold mb-6">
              What do you want to call your workspace?
            </h1>
            <p className="text-xl leading-relaxed">
              Choose something your team will recognize. You can always change this later.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-6">
              Who else is on the {workspaceName} workspace?
            </h1>
            <p className="text-xl leading-relaxed">
              Add coworkers by email to invite them to your workspace. They'll receive an invitation to join.
            </p>
          </>
        )}

        <div className="mt-12 flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-white text-dark-red' : 'bg-white/30 text-white'}`}>
            1
          </div>
          <div className="h-1 w-12 bg-white/30"></div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-white text-dark-red' : 'bg-white/30 text-white'}`}>
            2
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {step === 1 ? (
            <form onSubmit={handleStep1Next} className="space-y-6">
              <div>
                <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-700 mb-2">
                  Workspace Name *
                </label>
                <input
                  id="workspaceName"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Aurora Digital"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Type *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setOrganizationType('private')}
                    className={`flex-1 py-3 px-4 rounded-input border-2 font-medium transition-colors ${
                      organizationType === 'private'
                        ? 'border-dark-red bg-dark-red text-white'
                        : 'border-gray-border hover:border-dark-red'
                    }`}
                  >
                    Private
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrganizationType('public')}
                    className={`flex-1 py-3 px-4 rounded-input border-2 font-medium transition-colors ${
                      organizationType === 'public'
                        ? 'border-dark-red bg-dark-red text-white'
                        : 'border-gray-border hover:border-dark-red'
                    }`}
                  >
                    Public
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full">
                Next
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner (You)
                </label>
                <input
                  type="email"
                  value="you@example.com"
                  className="input-field bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label htmlFor="coworkerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Add Coworker by Email
                </label>
                <div className="flex gap-2">
                  <input
                    id="coworkerEmail"
                    type="email"
                    value={coworkerEmail}
                    onChange={(e) => setCoworkerEmail(e.target.value)}
                    className="input-field"
                    placeholder="coworker@example.com"
                  />
                  <button
                    type="button"
                    onClick={handleAddCoworker}
                    className="px-4 py-2 bg-dark-red text-white rounded-button font-semibold hover:bg-maroon"
                  >
                    Add
                  </button>
                </div>
              </div>

              {coworkers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Added Coworkers:</p>
                  {coworkers.map((email) => (
                    <div key={email} className="flex items-center justify-between p-3 bg-light-gray rounded-input">
                      <span className="text-sm">{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCoworker(email)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Create Workspace
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
