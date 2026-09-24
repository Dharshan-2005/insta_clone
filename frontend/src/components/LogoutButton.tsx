'use client';

import { LogOut } from 'lucide-react';
import { api } from '@/lib/api';

export default function LogoutButton() {
  const logout = async () => {
    await api.post('/auth/logout').catch(() => undefined);
    window.location.assign('/auth/login');
  };

  return (
    <button
      type="button"
      onClick={logout}
      className="flex items-center gap-2 text-sm font-semibold text-rose-400 hover:text-rose-300"
    >
      <LogOut className="size-4" /> Log out
    </button>
  );
}
