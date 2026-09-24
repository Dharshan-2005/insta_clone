import type { Metadata } from 'next';
import LogoutButton from '@/components/LogoutButton';
import SettingsForm from '@/components/SettingsForm';
import { getCurrentUser, serverApi } from '@/lib/server-api';

export const metadata: Metadata = { title: 'Edit profile' };

export default async function SettingsPage() {
  const [profile, account] = await Promise.all([getCurrentUser(), serverApi<{ email: string }>('/auth/me')]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold">Edit profile</h1>
        <p className="text-sm text-neutral-400">{account.email}</p>
      </div>
      <SettingsForm profile={profile} />
      <div className="border-t border-neutral-800 pt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
