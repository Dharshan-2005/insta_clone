'use client';

import { Compass, Heart, Home, PlusSquare, Send, Settings, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Avatar from './Avatar';
import { useCurrentUser } from './CurrentUser';
import Logo from './Logo';

const LINKS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/messages', label: 'Messages', icon: Send },
  { href: '/notifications', label: 'Notifications', icon: Heart },
  { href: '/create', label: 'Create', icon: PlusSquare },
];

function useUnreadNotifications(pathname: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    api
      .get<{ count: number }>('/notifications/unread-count')
      .then(({ count }) => setCount(count))
      .catch(() => undefined);
    const socket = getSocket();
    const increment = () => setCount((current) => current + 1);
    socket.on('notification', increment);
    return () => {
      socket.off('notification', increment);
    };
  }, []);

  useEffect(() => {
    if (pathname === '/notifications') setCount(0);
  }, [pathname]);

  return count;
}

export default function Nav() {
  const pathname = usePathname();
  const me = useCurrentUser();
  const unread = useUnreadNotifications(pathname);
  const profileHref = `/users/${me.username}`;
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const badge = (href: string) =>
    href === '/notifications' && unread > 0 ? (
      <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-black" />
    ) : null;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col border-r border-neutral-800 bg-black px-3 py-6 md:flex xl:w-60">
        <Link href="/" className="mb-8 flex items-center gap-3 px-3 py-2">
          <Logo />
          <span className="hidden text-xl font-semibold tracking-tight xl:inline">Instagram</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={label}
              className={`relative flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-neutral-900 ${
                isActive(href) ? 'font-semibold' : ''
              }`}
            >
              <Icon className="size-6" strokeWidth={isActive(href) ? 2.5 : 1.8} />
              <span className="hidden xl:inline">{label}</span>
              {badge(href)}
            </Link>
          ))}
          <Link
            href={profileHref}
            title="Profile"
            className={`flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-neutral-900 ${
              pathname === profileHref ? 'font-semibold' : ''
            }`}
          >
            <Avatar user={me} size={24} />
            <span className="hidden xl:inline">Profile</span>
          </Link>
        </nav>
        <Link
          href="/settings"
          title="Settings"
          className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-neutral-900"
        >
          <Settings className="size-6" strokeWidth={1.8} />
          <span className="hidden xl:inline">Settings</span>
        </Link>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-12 items-center justify-around border-t border-neutral-800 bg-black md:hidden">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-label={label} className="relative p-2">
            <Icon className="size-6" strokeWidth={isActive(href) ? 2.5 : 1.8} />
            {badge(href)}
          </Link>
        ))}
        <Link href={profileHref} aria-label="Profile" className="p-2">
          <Avatar user={me} size={24} />
        </Link>
      </nav>
    </>
  );
}
