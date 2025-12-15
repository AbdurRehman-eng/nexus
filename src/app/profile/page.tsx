'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUserProfile, updateProfile, uploadProfileImage } from '@/app/actions/profiles';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    phone: '',
    job_title: '',
    avatar_url: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    const result = await getCurrentUserProfile(session.access_token);
    
    if (result.error) {
      if (result.error === 'Not authenticated') {
        router.push('/login');
        return;
      }
      setError(result.error);
    } else {
      setProfile(result.data);
      setFormData({
        username: result.data?.username || '',
        display_name: result.data?.display_name || '',
        bio: result.data?.bio || '',
        phone: result.data?.phone || '',
        job_title: result.data?.job_title || '',
        avatar_url: result.data?.avatar_url || ''
      });
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    const result = await updateProfile(session.access_token, {
      username: formData.username,
      display_name: formData.display_name,
      bio: formData.bio,
      phone: formData.phone,
      job_title: formData.job_title,
      avatar_url: formData.avatar_url
    });
    
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      setProfile(result.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      // Revalidate chat pages to update avatars
      window.location.reload();
    }
    
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - only allow image files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      e.target.value = ''; // Clear the input
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      e.target.value = ''; // Clear the input
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingImage(true);
    setError('');

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    const result = await uploadProfileImage(session.access_token, {
      name: file.name,
      type: file.type,
      size: file.size,
      arrayBuffer: arrayBuffer
    });

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setImagePreview(null);
    } else {
      // Update form data and profile with new image URL
      setFormData({ ...formData, avatar_url: result.data?.url || '' });
      if (result.data?.profile) {
        setProfile(result.data.profile);
      }
      toast.success('Profile image uploaded successfully!');
    }

    setUploadingImage(false);
    // Clear file input
    e.target.value = '';
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.charAt(0).toUpperCase();
    }
    if (profile?.username) {
      return profile.username.charAt(0).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-gray flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-light-gray flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/homepage" className="btn-primary">Go to Homepage</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-gray">
      <nav className="bg-white border-b border-gray-border px-4 sm:px-6 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/homepage" className="text-xl sm:text-2xl font-bold text-dark-red">
            NEXUS <span className="text-xs sm:text-sm font-normal text-gray-600">by AKD</span>
          </Link>
          <Link href="/homepage" className="text-xs sm:text-sm text-gray-700 hover:text-dark-red">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      username: profile?.username || '',
                      display_name: profile?.display_name || '',
                      bio: profile?.bio || '',
                      phone: profile?.phone || '',
                      job_title: profile?.job_title || '',
                      avatar_url: profile?.avatar_url || ''
                    });
                  }}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-input text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-dark-red text-white flex items-center justify-center text-3xl sm:text-4xl font-bold flex-shrink-0 overflow-hidden">
                  {(imagePreview || profile?.avatar_url) ? (
                    <img
                      src={imagePreview || profile.avatar_url}
                      alt={profile?.username || 'Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.textContent = getInitials();
                        }
                      }}
                    />
                  ) : (
                    getInitials()
                  )}
                </div>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload an image (JPEG, PNG, GIF, or WebP, max 5MB)
                    </p>
                    {profile?.avatar_url && (
                      <p className="text-xs text-gray-400 mt-1">
                        Current: <a href={profile.avatar_url} target="_blank" rel="noopener noreferrer" className="text-dark-red hover:underline">View current image</a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field"
                  required
                />
              ) : (
                <p className="text-gray-900">{profile?.username || 'Not set'}</p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="input-field"
                  placeholder="Your display name"
                />
              ) : (
                <p className="text-gray-900">{profile?.display_name || 'Not set'}</p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <p className="text-gray-600">{profile?.email || 'Not available'}</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input-field"
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{profile?.bio || 'No bio yet'}</p>
              )}
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Software Engineer"
                />
              ) : (
                <p className="text-gray-900">{profile?.job_title || 'Not set'}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <p className="text-gray-900">{profile?.phone || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
