'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getWorkspaceMembers, addWorkspaceMember, removeWorkspaceMember } from '@/app/actions/workspaces';
import toast from 'react-hot-toast';

interface Member {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  role: string;
  joined_at: string;
}

export default function WorkspaceMembersPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const [accessToken, setAccessToken] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    checkAuthAndLoadMembers();
  }, [workspaceId]);

  const checkAuthAndLoadMembers = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    setAccessToken(session.access_token);
    await loadMembers(session.access_token);
  };

  const loadMembers = async (token: string) => {
    setLoading(true);
    const result = await getWorkspaceMembers(token, workspaceId);
    
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    
    setMembers(result.data || []);
    setLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMemberEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setAdding(true);
    const result = await addWorkspaceMember(accessToken, workspaceId, newMemberEmail);
    
    if (result.error) {
      toast.error(result.error);
      setAdding(false);
      return;
    }
    
    toast.success(`Added ${result.data?.username || result.data?.email} to workspace`);
    setNewMemberEmail('');
    setAdding(false);
    await loadMembers(accessToken);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) {
      return;
    }

    const result = await removeWorkspaceMember(accessToken, workspaceId, memberId);
    
    if (result.error) {
      toast.error(result.error);
      return;
    }
    
    toast.success(`Removed ${memberName} from workspace`);
    await loadMembers(accessToken);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chat-bg p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push(`/chat/${workspaceId}`)}
              className="text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Back to Workspace
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Workspace Members</h1>
            <p className="text-gray-600 mt-1">{members.length} members</p>
          </div>
        </div>

        {/* Add Member Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Add New Member</h2>
          <form onSubmit={handleAddMember} className="flex gap-4">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Enter member's email address"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-red"
              disabled={adding}
            />
            <button
              type="submit"
              disabled={adding}
              className="px-6 py-2 bg-dark-red text-white rounded-lg hover:bg-maroon disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {adding ? 'Adding...' : 'Add Member'}
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-2">
            Members will be automatically added to all public channels
          </p>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Current Members</h2>
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-dark-red text-white flex items-center justify-center text-xl font-bold">
                        {member.username[0]?.toUpperCase() || member.email[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{member.username}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      member.role === 'owner'
                        ? 'bg-yellow-100 text-yellow-800'
                        : member.role === 'admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.username || member.email)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


