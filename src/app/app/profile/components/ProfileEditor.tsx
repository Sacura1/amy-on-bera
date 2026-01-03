'use client';

import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/constants';

interface ProfileEditorProps {
  wallet: string;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export default function ProfileEditor({
  wallet,
  isOpen,
  onClose,
  onProfileUpdated
}: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!wallet || !isOpen) return;

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${wallet}`);
        const data = await response.json();

        if (data.success && data.data.profile) {
          setDisplayName(data.data.profile.displayName || '');
          setBio(data.data.profile.bio || '');
          setAvatarUrl(data.data.profile.avatarUrl || null);
          setAvatarData(data.data.profile.avatarData || null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [wallet, isOpen]);

  // Clean up preview URL when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setError('');
    setSelectedFile(file);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const uploadAvatar = async (): Promise<boolean> => {
    if (!selectedFile) return true; // No file to upload

    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      // Wallet must be appended before file for multer to parse it correctly
      formData.append('wallet', wallet);
      formData.append('avatar', selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/profile/avatar/upload`, {
        method: 'POST',
        body: formData
      });

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        setError(`Upload failed: ${responseText.substring(0, 100)}`);
        return false;
      }

      if (data.success) {
        setAvatarUrl(data.data.avatarUrl || null);
        setAvatarData(data.data.avatarData || null);
        setSelectedFile(null);
        if (avatarPreview) {
          URL.revokeObjectURL(avatarPreview);
          setAvatarPreview(null);
        }
        return true;
      } else {
        const errorMsg = data.error || data.message || `Upload failed (status: ${response.status})`;
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Network error - failed to upload avatar');
      return false;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');

      // Upload avatar first if one is selected
      if (selectedFile) {
        const avatarSuccess = await uploadAvatar();
        if (!avatarSuccess) {
          setIsSaving(false);
          return;
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          displayName: displayName.trim() || null,
          bio: bio.trim() || null
        })
      });

      const data = await response.json();

      if (data.success) {
        onProfileUpdated();
        onClose();
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarDisplay = () => {
    if (avatarPreview) return avatarPreview;
    // Prioritize base64 data (stored in PostgreSQL, persists across deploys)
    if (avatarData) return avatarData;
    // Fallback to URL (legacy, may be lost on deploy)
    if (avatarUrl) return `${API_BASE_URL}${avatarUrl}`;
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              {/* Avatar Preview */}
              <div
                className="w-20 h-20 rounded-full border-2 border-gray-600 overflow-hidden cursor-pointer hover:border-pink-500 transition-colors flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                {getAvatarDisplay() ? (
                  <img
                    src={getAvatarDisplay()!}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isUploadingAvatar ? 'Uploading...' : 'Choose Image'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  JPEG, PNG, GIF, or WebP. Max 5MB.
                </p>
                {selectedFile && (
                  <p className="text-xs text-green-400 mt-1">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Enter display name..."
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              {displayName.length}/50 characters
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={140}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {bio.length}/140 characters
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-semibold hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 btn-samy btn-samy-enhanced text-white py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
