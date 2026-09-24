'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Film,
  Send,
  Search,
  Heart,
  PlusSquare,
  Menu,
  LayoutGrid,
} from 'lucide-react';
import InstagramLogo from '@/components/InstagramLogo';

export default function DesktopNav() {
  const pathname = usePathname();

  // Exactly matching the icon order in Screenshot 1 & Screenshot 2
  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Reels', href: '/explore', icon: Film },
    { label: 'Messages', href: '/messages', icon: Send },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Notifications', href: '/notifications', icon: Heart },
    { label: 'Create', href: '/create', icon: PlusSquare },
  ];

  const isProfileActive = pathname === '/profile' || pathname.startsWith('/users/');

  return (
    <aside className="hidden md:flex flex-col justify-between items-center fixed left-0 top-0 bottom-0 w-[72px] h-screen bg-black border-r border-[#262626] py-6 z-50 select-none">
      {/* Top: Instagram Camera Logo */}
      <div className="flex flex-col items-center gap-6 w-full">
        <Link
          href="/"
          className="p-3 text-white hover:scale-105 transition-transform"
          aria-label="Instagram Home"
        >
          <InstagramLogo variant="icon" size={28} />
        </Link>

        {/* Navigation Items Stack */}
        <nav className="flex flex-col items-center gap-2.5 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                title={item.label}
                className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center relative group ${
                  isActive
                    ? 'text-white bg-white/[0.08]'
                    : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon
                  className={`size-[26px] transition-transform group-hover:scale-110 ${
                    isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}

          {/* Profile Item with Avatar Circle */}
          <Link
            href="/profile"
            title="Profile"
            className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center relative group ${
              isProfileActive
                ? 'text-white bg-white/[0.08]'
                : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <div
              className={`size-7 rounded-full overflow-hidden border-2 transition-all group-hover:scale-110 ${
                isProfileActive ? 'border-white' : 'border-neutral-500'
              }`}
            >
              <div className="w-full h-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                <svg className="size-4 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </div>
            <span className="sr-only">Profile</span>
          </Link>
        </nav>
      </div>

      {/* Bottom: Menu & Apps (Matching Screenshot 1 & 2) */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        <button
          type="button"
          title="More options"
          className="p-3 text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
        >
          <Menu className="size-[26px] stroke-[2]" />
        </button>
        <Link
          href="/settings"
          title="Apps"
          className="p-3 text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
        >
          <LayoutGrid className="size-[24px] stroke-[1.8]" />
        </Link>
      </div>
    </aside>
  );
}