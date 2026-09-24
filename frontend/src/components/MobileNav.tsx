'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Film, PlusSquare, Send } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  const isHomeActive = pathname === '/';
  const isSearchActive = pathname === '/search';
  const isReelsActive = pathname === '/explore';
  const isCreateActive = pathname === '/create';
  const isMessagesActive = pathname === '/messages';
  const isProfileActive = pathname === '/profile' || pathname.startsWith('/users/');

  return (
    <nav className="block md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-[#262626] h-12 select-none">
      <div className="flex items-center justify-around h-full px-2">
        {/* 1. Home */}
        <Link
          href="/"
          aria-label="Home"
          className="p-2 text-white hover:opacity-80 transition-opacity"
        >
          <Home
            className={`size-6 ${isHomeActive ? 'stroke-[2.5] fill-white' : 'stroke-[1.8]'}`}
          />
        </Link>

        {/* 2. Search */}
        <Link
          href="/search"
          aria-label="Search"
          className="p-2 text-white hover:opacity-80 transition-opacity"
        >
          <Search
            className={`size-6 ${isSearchActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`}
          />
        </Link>

        {/* 3. Reels */}
        <Link
          href="/explore"
          aria-label="Reels"
          className="p-2 text-white hover:opacity-80 transition-opacity"
        >
          <Film
            className={`size-6 ${isReelsActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`}
          />
        </Link>

        {/* 4. Create */}
        <Link
          href="/create"
          aria-label="Create Post"
          className="p-2 text-white hover:opacity-80 transition-opacity"
        >
          <PlusSquare
            className={`size-6 ${isCreateActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`}
          />
        </Link>

        {/* 5. Messages */}
        <Link
          href="/messages"
          aria-label="Messages"
          className="p-2 text-white hover:opacity-80 transition-opacity"
        >
          <Send
            className={`size-6 -rotate-12 ${isMessagesActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`}
          />
        </Link>

        {/* 6. Profile */}
        <Link
          href="/profile"
          aria-label="Profile"
          className="p-2 hover:opacity-80 transition-opacity"
        >
          <div
            className={`size-6 rounded-full overflow-hidden border-2 ${
              isProfileActive ? 'border-white' : 'border-neutral-500'
            }`}
          >
            <div className="w-full h-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white">
              <svg className="size-3.5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
        </Link>
      </div>
    </nav>
  );
}