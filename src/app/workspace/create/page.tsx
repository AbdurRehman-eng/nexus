"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/app/actions/workspaces";
import { createClient } from "@/lib/supabase/client";
import NexusLogo from "@/components/NexusLogo";

export default function CreateWorkspace() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [organizationType, setOrganizationType] = useState<
    "private" | "public"
  >("private");
  const [coworkerEmail, setCoworkerEmail] = useState("");
  const [coworkers, setCoworkers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [accessToken, setAccessToken] = useState("");

  // Check authentication and get user info
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setAccessToken(session.access_token);
      setUserEmail(session.user.email || "");
    };

    checkAuth();
  }, [router]);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (workspaceName.trim()) {
      setStep(2);
    }
  };

  const handleAddCoworker = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const email = coworkerEmail.trim().toLowerCase();
    if (email && !coworkers.includes(email)) {
      setCoworkers([...coworkers, email]);
      setCoworkerEmail("");
    }
  };

  const handleRemoveCoworker = (email: string) => {
    setCoworkers(coworkers.filter((c) => c !== email));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Pass access token to authenticate the request
    const result = await createWorkspace(
      accessToken,
      workspaceName,
      organizationType,
      coworkers
    );

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Redirect to homepage after successful creation
      router.push("/homepage");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#4A0808] text-white p-12 flex-col relative overflow-hidden">
        {/* Logo at top */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <NexusLogo className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">NEXUS</h1>
              <p className="text-xs text-white/70">by ARD</p>
            </div>
          </div>
        </div>

        {/* Content centered vertically */}
        <div className="flex-1 flex flex-col justify-center relative z-10 max-w-lg">
          {/* Single Card for All Content */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/10">
            {step === 1 ? (
              <>
                <h2 className="text-4xl font-bold mb-6 text-white leading-tight">
                  Create Your Workspace
                </h2>
                <p className="text-lg leading-relaxed text-white/80 mb-8">
                  Choose a name that your team will recognize. You can always
                  change this later.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                    <span>Organize your team communications</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                    <span>Choose between private or public workspace</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                    <span>Invite team members to collaborate</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold mb-6 text-white leading-tight">
                  Build Your Team
                </h2>
                <p className="text-lg leading-relaxed text-white/80 mb-8">
                  Add coworkers by email to invite them to {workspaceName}.
                  They'll receive an invitation to join.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                    <span>Invite unlimited team members</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                    <span>Manage permissions and roles</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                    <span>Start collaborating instantly</span>
                  </div>
                </div>
              </>
            )}

            {/* Progress Indicator */}
            <div className="mt-12 flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                  step === 1
                    ? "bg-white text-[#4A0808]"
                    : "bg-white/30 text-white"
                }`}
              >
                1
              </div>
              <div className="h-1 w-12 bg-white/30"></div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                  step === 2
                    ? "bg-white text-[#4A0808]"
                    : "bg-white/30 text-white"
                }`}
              >
                2
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#E5E9F0]">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10">
          {/* Mobile header */}
          <h2 className="lg:hidden text-3xl font-bold text-[#1C2143] mb-8 text-center">
            {step === 1 ? "Create Workspace" : "Add Team Members"}
          </h2>

          {step === 1 ? (
            <form onSubmit={handleStep1Next} className="space-y-6">
              <div>
                <label
                  htmlFor="workspaceName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
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
                    onClick={() => setOrganizationType("private")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      organizationType === "private"
                        ? "border-[#1C2143] bg-[#1C2143] text-white"
                        : "border-gray-300 hover:border-[#3A506B] text-gray-700"
                    }`}
                  >
                    Private
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrganizationType("public")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      organizationType === "public"
                        ? "border-[#1C2143] bg-[#1C2143] text-white"
                        : "border-gray-300 hover:border-[#3A506B] text-gray-700"
                    }`}
                  >
                    Public
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#1C2143] hover:bg-[#3A506B] text-white w-full py-3 rounded-lg font-semibold transition-all"
              >
                Next
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner (You)
                </label>
                <input
                  type="email"
                  value={userEmail || "Loading..."}
                  className="input-field bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label
                  htmlFor="coworkerEmail"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Add Coworker by Email
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="coworkerEmail"
                    type="email"
                    value={coworkerEmail}
                    onChange={(e) => setCoworkerEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCoworker();
                      }
                    }}
                    className="input-field flex-1"
                    placeholder="coworker@example.com"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={handleAddCoworker}
                    disabled={loading || !coworkerEmail.trim()}
                    className="px-4 py-2 bg-[#1C2143] text-white rounded-lg font-semibold hover:bg-[#3A506B] disabled:opacity-50 transition-all w-full sm:w-auto"
                  >
                    Add
                  </button>
                </div>
              </div>

              {coworkers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Added Coworkers:
                  </p>
                  {coworkers.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-3 bg-[#E5E9F0] rounded-lg"
                    >
                      <span className="text-sm text-gray-700">{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCoworker(email)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 w-full px-6 py-3 border-2 border-[#3A506B] text-[#3A506B] rounded-lg font-semibold hover:bg-[#3A506B] hover:text-white transition-all"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-[#1C2143] hover:bg-[#3A506B] text-white flex-1 w-full py-3 rounded-lg font-semibold transition-all"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
