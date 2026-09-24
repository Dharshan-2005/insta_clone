'use client';

import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { UserSummary } from '@/lib/types';
import Avatar from './Avatar';

type Props = {
  placeholder?: string;
  onSelect?: (user: UserSummary) => void;
};

function useUserSearch(query: string) {
  const [results, setResults] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .get<UserSummary[]>(`/users/search?q=${encodeURIComponent(q)}`)
        .then((users) => {
          if (!controller.signal.aborted) setResults(users);
        })
        .catch(() => undefined)
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  return { results, loading };
}

export default function UserSearch({ placeholder = 'Search', onSelect }: Props) {
  const [query, setQuery] = useState('');
  const { results, loading } = useUserSearch(query);
  const showResults = query.trim().length > 0;

  const select = (user: UserSummary) => {
    setQuery('');
    onSelect?.(user);
  };

  return (
    <div className="relative">
      <div className="flex h-10 items-center gap-3 rounded-lg bg-neutral-800 px-4">
        <Search className="size-4 text-neutral-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
            <X className="size-4 text-neutral-400" />
          </button>
        )}
      </div>
      {showResults && (
        <div className="absolute inset-x-0 top-12 z-30 max-h-80 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900 p-1 shadow-xl">
          {loading && results.length === 0 ? (
            <p className="p-3 text-center text-sm text-neutral-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="p-3 text-center text-sm text-neutral-400">No results found.</p>
          ) : (
            results.map((user) =>
              onSelect ? (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => select(user)}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-neutral-800"
                >
                  <SearchResult user={user} />
                </button>
              ) : (
                <Link
                  key={user.id}
                  href={`/users/${user.username}`}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-neutral-800"
                >
                  <SearchResult user={user} />
                </Link>
              ),
            )
          )}
        </div>
      )}
    </div>
  );
}

function SearchResult({ user }: { user: UserSummary }) {
  return (
    <>
      <Avatar user={user} size={40} />
      <div className="min-w-0 text-sm leading-tight">
        <p className="truncate font-semibold">{user.username}</p>
        {user.name && <p className="truncate text-neutral-400">{user.name}</p>}
      </div>
    </>
  );
}
