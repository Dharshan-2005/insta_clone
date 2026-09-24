'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import type { Page } from './types';

export function useInfinite<T extends { id: string }>(path: string, initial: Page<T>) {
  const [items, setItems] = useState(initial.data);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(initial.data);
    setCursor(initial.nextCursor);
  }, [initial]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !cursor || loading) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setLoading(true);
        try {
          const separator = path.includes('?') ? '&' : '?';
          const page = await api.get<Page<T>>(`${path}${separator}cursor=${cursor}`);
          setItems((current) => [...current, ...page.data.filter((item) => !current.some((c) => c.id === item.id))]);
          setCursor(page.nextCursor);
        } catch {
          setCursor(null);
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: '600px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [path, cursor, loading]);

  return { items, setItems, sentinel, hasMore: cursor !== null };
}
