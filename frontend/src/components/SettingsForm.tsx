'use client';

import React, { useRef, useState } from 'react';
import { updateProfile } from '@/actions';
import { Profile } from '@/types';
import { getMediaUrl } from '@/lib/api/client';
import { Camera, Check, Loader2, Sparkles, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsForm({
  profile,
}: {
  profile: Profile | null;
}) {
  const router = useRouter();
  const fileInRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatar || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [name, setName] = useState(profile?.name || '');
  const [subtitle, setSubtitle] = useState(profile?.subtitle || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle image upload with FileReader for instant client preview and data URL storage
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, or WebP).');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
        setSelectedFile(selectedFile);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      let finalAvatar = avatarUrl;

      // If user selected a new image file, upload it directly first
      if (selectedFile) {
        const uploadForm = new FormData();
        uploadForm.append('file', selectedFile);
        const upRes = await fetch('/api/upload/avatar', {
          method: 'POST',
          body: uploadForm,
        });
        const upData = await upRes.json();
        if (!upRes.ok || !upData.success) {
          throw new Error(upData.message || 'Failed to upload profile photo');
        }
        finalAvatar = upData.url;
        setAvatarUrl(upData.url);
      }

      const formData = new FormData();
      formData.set('username', username.trim().toLowerCase().replace(/\s+/g, '_'));
      formData.set('name', name.trim());
      formData.set('subtitle', subtitle.trim());
      formData.set('bio', bio.trim());
      formData.set('avatar', finalAvatar || '');

      await updateProfile(formData);
      setSavedSuccess(true);
      setTimeout(() => {
        router.push('/profile');
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full text-white">
      {/* Avatar Change Header */}
      <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/[0.03] border border-neutral-800">
        <div className="relative group cursor-pointer" onClick={() => fileInRef.current?.click()}>
          <div className="size-20 rounded-full overflow-hidden border-2 border-neutral-700 bg-neutral-900 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={getMediaUrl(avatarUrl)}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center font-bold text-2xl text-white">
                {name ? name[0]?.toUpperCase() : username ? username[0]?.toUpperCase() : <User className="size-8" />}
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="size-6 text-white" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-sm text-white">
            @{username || 'username'}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInRef.current?.click()}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            >
              Change profile photo
            </button>
            {avatarUrl && (
              <>
                <span className="text-neutral-600 text-xs">•</span>
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 text-center">
          {error}
        </div>
      )}

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-center gap-2">
          <Check className="size-4" />
          <span>Profile updated successfully! Redirecting...</span>
        </div>
      )}

      {/* Inputs */}
      <div className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-400">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-400">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            required
            className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Subtitle / Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-400">Category / Profession</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. Photographer, Designer, Creator"
            className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-400">Bio</label>
            <span className="text-[11px] text-neutral-500">{bio.length} / 150</span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 150))}
            rows={3}
            placeholder="Write a short bio about yourself..."
            className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-400 active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Saving changes...</span>
            </>
          ) : (
            <span>Submit</span>
          )}
        </button>
      </div>
    </form>
  );
}