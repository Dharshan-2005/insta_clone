'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import type { Profile } from '@/lib/types';
import Avatar from './Avatar';

type Status = { type: 'success' | 'error'; message: string } | null;

const inputClass =
  'w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-600';

export default function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [form, setForm] = useState({
    name: profile.name ?? '',
    username: profile.username,
    subtitle: profile.subtitle ?? '',
    bio: profile.bio ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setStatus(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const updated = await api.post<Profile>('/users/me/avatar', body);
      setAvatar(updated.avatar);
      router.refresh();
    } catch (err) {
      setStatus({ type: 'error', message: errorMessage(err) });
    } finally {
      setUploading(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const updated = await api.patch<Profile>('/users/me', form);
      setForm((current) => ({ ...current, username: updated.username }));
      setStatus({ type: 'success', message: 'Profile saved' });
      router.refresh();
    } catch (err) {
      setStatus({ type: 'error', message: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <div className="flex items-center gap-4 rounded-xl bg-neutral-900 p-4">
        <Avatar user={{ username: form.username || profile.username, avatar }} size={56} />
        <div className="flex-1 text-sm">
          <p className="font-semibold">{profile.username}</p>
          <p className="text-neutral-400">{profile.name}</p>
        </div>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold hover:bg-sky-600 disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : 'Change photo'}
        </button>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Name
        <input value={form.name} onChange={update('name')} maxLength={60} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Username
        <input
          value={form.username}
          onChange={update('username')}
          required
          minLength={3}
          maxLength={30}
          pattern="[A-Za-z0-9._]+"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Category
        <input
          value={form.subtitle}
          onChange={update('subtitle')}
          maxLength={60}
          placeholder="Photographer, designer, creator…"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        <span className="flex justify-between">
          Bio <span className="font-normal text-neutral-500">{form.bio.length} / 150</span>
        </span>
        <textarea value={form.bio} onChange={update('bio')} maxLength={150} rows={3} className={`${inputClass} resize-none`} />
      </label>

      {status && (
        <p className={`text-sm ${status.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>{status.message}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-sky-500 py-2 text-sm font-semibold hover:bg-sky-600 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
