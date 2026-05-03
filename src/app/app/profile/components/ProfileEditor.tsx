'use client';

import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import { CARD_BACKGROUNDS } from './ProfileCard';

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
  const [showX, setShowX] = useState(false);
  const [showDiscord, setShowDiscord] = useState(false);
  const [showTelegram, setShowTelegram] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [backgroundId, setBackgroundId] = useState<string>('bg_desktop_1');
  const [bgOffset, setBgOffset] = useState(0);
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
          setShowX(data.data.profile.showX ?? false);
          setShowDiscord(data.data.profile.showDiscord ?? false);
          setShowTelegram(data.data.profile.showTelegram ?? false);
          setShowBalance(data.data.profile.showBalance ?? false);
          // Card background is separate from the app background/customization.
          const storedBg = localStorage.getItem(`amy-card-bg-${wallet.toLowerCase()}`);
          const backendBg = data.data.profile.cardBackgroundId;
          const effectiveBg = backendBg || storedBg || 'bg_desktop_1';
          setBackgroundId(effectiveBg);
          if (backendBg) {
            localStorage.setItem(`amy-card-bg-${wallet.toLowerCase()}`, backendBg);
          } else if (storedBg) {
            fetch(`${API_BASE_URL}/api/profile/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ wallet, cardBackgroundId: storedBg }),
            }).catch(() => {});
          }
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
          bio: bio.trim() || null,
          showX,
          showDiscord,
          showTelegram,
          showBalance,
          cardBackgroundId: backgroundId,
        })
      });

      const data = await response.json();

      if (data.success) {
        // Persist card background choice locally (separate from customisation section)
        localStorage.setItem(`amy-card-bg-${wallet.toLowerCase()}`, backgroundId);
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
      <div className="relative bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700">
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
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
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

          {/* Card Background */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-1">
              Card Background
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Choose a background image for your profile card.
            </p>
            <div className="flex items-center gap-2">
              {/* Prev arrow */}
              <button
                type="button"
                onClick={() => setBgOffset(o => Math.max(0, o - 1))}
                disabled={bgOffset === 0}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* None + 2 visible backgrounds */}
              <div className="flex flex-1 gap-2">
                <button
                  type="button"
                  onClick={() => setBackgroundId('none')}
                  className={`flex-1 aspect-video rounded-lg border-2 flex items-center justify-center text-xs font-semibold transition-colors ${backgroundId === 'none' ? 'border-pink-500 text-pink-400 bg-gray-700' : 'border-gray-600 text-gray-400 bg-gray-800 hover:border-gray-500'}`}
                >
                  None
                </button>
                {CARD_BACKGROUNDS.slice(bgOffset, bgOffset + 2).map(bg => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBackgroundId(bg.id)}
                    className={`flex-1 aspect-video rounded-lg border-2 overflow-hidden transition-colors relative ${backgroundId === bg.id ? 'border-pink-500' : 'border-gray-600 hover:border-gray-400'}`}
                  >
                    <img src={bg.path} alt={bg.label} className="w-full h-full object-cover" />
                    {backgroundId === bg.id && (
                      <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Next arrow */}
              <button
                type="button"
                onClick={() => setBgOffset(o => Math.min(CARD_BACKGROUNDS.length - 2, o + 1))}
                disabled={bgOffset >= CARD_BACKGROUNDS.length - 2}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1 mt-2">
              {Array.from({ length: CARD_BACKGROUNDS.length - 1 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setBgOffset(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${bgOffset === i ? 'bg-pink-500' : 'bg-gray-600'}`}
                />
              ))}
            </div>
          </div>

          {/* Socials */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-1">
              Socials
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Choose which social links appear on your profile and shared card.
            </p>
            <div className="space-y-2">
              {[
                { label: 'X (Twitter)',          value: showX,       setter: setShowX },
                { label: 'Discord',              value: showDiscord, setter: setShowDiscord },
                { label: 'Telegram',             value: showTelegram, setter: setShowTelegram },
                { label: 'Show AMY balance',     value: showBalance, setter: setShowBalance },
              ].map(({ label, value, setter }) => (
                <label key={label} className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setter(v => !v)}
                    className={`w-9 h-5 rounded-full flex-shrink-0 transition-colors relative ${value ? 'bg-pink-600' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-700 flex gap-3">
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
