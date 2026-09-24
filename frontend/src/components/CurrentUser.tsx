'use client';

import { createContext, useContext } from 'react';
import type { Profile } from '@/lib/types';

const CurrentUserContext = createContext<Profile | null>(null);

export function CurrentUserProvider({ user, children }: { user: Profile; children: React.ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): Profile {
  const user = useContext(CurrentUserContext);
  if (!user) throw new Error('useCurrentUser must be used within CurrentUserProvider');
  return user;
}
