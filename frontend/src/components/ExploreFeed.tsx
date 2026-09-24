'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, Heart, MessageCircle, Clapperboard, CheckCircle2 } from 'lucide-react';
import { Post } from '@/types';
import { getMediaUrl } from '@/lib/api/client';

interface ExploreFeedProps {
  initialPosts?: Post[];
  defaultQuery?: string;
}





export default function ExploreFeed({ initialPosts = [], defaultQuery = '' }: ExploreFeedProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [explorePosts, setExplorePosts] = useState<Post[]>(initialPosts);

  // Fetch real explore posts from feed-service
  useEffect(() => {
    if (initialPosts.length > 0) return;
    const loadExplore = async () => {
      try {
        const res = await fetch('/api/gateway/feed/explore');
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json?.data || [];
          if (list.length > 0) setExplorePosts(list);
        }
      } catch (err) {
        console.warn('Failed to load explore feed:', err);
      }
    };
    loadExplore();
  }, [initialPosts]);

  // Live User Search from Database API
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/gateway/users/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data : data?.data || []);
        }
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full min-h-screen bg-black text-white pt-4 pb-16 select-none">
      {/* Top: Centered Search Bar Pill (Matching Screenshot 2) */}
      <div ref={searchContainerRef} className="relative w-full max-w-[420px] mx-auto px-4 mb-6 z-30">
        <div className="w-full bg-[#262626] hover:bg-[#303030] focus-within:bg-[#333333] transition-colors rounded-xl h-10 px-4 flex items-center gap-3">
          <Search className="size-4 text-neutral-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search"
            className="w-full bg-transparent text-sm text-white placeholder-neutral-400 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setSearchResults([]);
              }}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Live Search Results Dropdown */}
        {showDropdown && query.trim().length > 0 && (
          <div className="absolute top-12 left-4 right-4 bg-[#262626] border border-neutral-700/80 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50 divide-y divide-neutral-800">
            {isSearching ? (
              <div className="p-4 text-center text-xs text-neutral-400">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user: any) => (
                <Link
                  key={user.id || user.username}
                  href={`/users/${user.username}`}
                  onClick={() => setShowDropdown(false)}
                  className="p-3 flex items-center gap-3 hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <div className="size-10 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center flex-shrink-0 text-sm font-bold text-neutral-200">
                    {user.avatar ? (
                      <img src={getMediaUrl(user.avatar)} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      user.username[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white truncate">{user.username}</span>
                      <CheckCircle2 className="size-3.5 text-sky-400 fill-sky-400 stroke-black flex-shrink-0" />
                    </div>
                    {user.name ? (
                      <p className="text-xs text-neutral-400 truncate">{user.name}</p>
                    ) : null}
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-neutral-400">No results found for &quot;{query}&quot;</div>
            )}
          </div>
        )}
      </div>

      {/* 4-Column Dense Explore Media Grid (Matching Screenshot 2) */}
      <div className="w-full max-w-6xl mx-auto px-1 md:px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-1.5">
          {/* 1. Database Posts (if available) */}
          {explorePosts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="relative aspect-square md:aspect-[4/5] bg-[#121212] group overflow-hidden cursor-pointer"
            >
              <img
                src={getMediaUrl(post.mediaPath || post.image)}
                alt={post.caption || 'Instagram Post'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Video Badge */}
              <div className="absolute top-2.5 right-2.5 z-10 text-white drop-shadow-md">
                <Clapperboard className="size-4.5 stroke-[2] fill-black/20" />
              </div>

              {/* Hover Stats */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm z-20">
                <div className="flex items-center gap-1.5">
                  <Heart className="size-5 fill-white stroke-none" />
                  <span>{post.likesCount || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="size-5 fill-white stroke-none" />
                  <span>{post.commentsCount || 0}</span>
                </div>
              </div>
            </Link>
          ))}

          {/* Empty State when no database posts are present */}
          {explorePosts.length === 0 && (
            <div className="col-span-full py-20 text-center text-neutral-500 text-sm font-medium">
              No posts found on Explore grid yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
