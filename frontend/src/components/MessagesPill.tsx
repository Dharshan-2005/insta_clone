'use client';

import React, { useState } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function MessagesPill() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Messages Pill */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-40 bg-[#262626] hover:bg-[#333333] border border-neutral-700/60 rounded-full px-4 py-2.5 flex items-center gap-2.5 text-white shadow-2xl transition-all duration-200 active:scale-95 group"
        aria-label="Messages"
      >
        <Send className="size-4 text-white group-hover:scale-110 transition-transform -rotate-12" />
        <span className="text-sm font-semibold tracking-tight">Messages</span>

        {/* Overlapping Demo Avatars */}
        <div className="flex -space-x-2 overflow-hidden ml-1">
          <div className="inline-block size-5 rounded-full ring-2 ring-[#262626] bg-gradient-to-tr from-amber-400 to-rose-500" />
          <div className="inline-block size-5 rounded-full ring-2 ring-[#262626] bg-gradient-to-tr from-cyan-400 to-blue-500" />
          <div className="inline-block size-5 rounded-full ring-2 ring-[#262626] bg-gradient-to-tr from-violet-400 to-pink-500" />
        </div>
      </button>

      {/* Quick Messages Drawer / Popup */}
      {open && (
        <div className="fixed bottom-16 right-4 z-50 w-80 bg-[#1e1e24] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-neutral-300" />
              <span className="font-semibold text-sm text-white">Direct Messages</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="divide-y divide-neutral-800/50 max-h-72 overflow-y-auto">
            {[
              { name: 'Emma Wilson', user: 'emmawilson', msg: 'Where was that photo taken? The lighting was magical ✨', time: '2m', color: 'from-amber-400 to-rose-500' },
              { name: 'Liam Chen', user: 'liamchen', msg: 'Awesome! Can’t wait to see it 🚀', time: '1h', color: 'from-cyan-400 to-blue-500' },
              { name: 'Sophia Patel', user: 'sophiapatel', msg: 'Have you tried that new brunch spot downtown? ☕', time: '3h', color: 'from-violet-400 to-pink-500' },
            ].map((dm) => (
              <Link
                key={dm.user}
                href="/messages"
                onClick={() => setOpen(false)}
                className="p-3 flex items-center gap-3 hover:bg-white/[0.04] transition cursor-pointer"
              >
                <div className={`size-10 rounded-full bg-gradient-to-tr ${dm.color} flex-shrink-0 flex items-center justify-center font-bold text-xs text-white`}>
                  {dm.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-white truncate">{dm.name}</span>
                    <span className="text-[10px] text-neutral-500">{dm.time}</span>
                  </div>
                  <p className="text-xs text-neutral-400 truncate">{dm.msg}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="p-2.5 bg-[#17171c] border-t border-neutral-800 text-center">
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 block py-0.5"
            >
              Open all in Messenger →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
