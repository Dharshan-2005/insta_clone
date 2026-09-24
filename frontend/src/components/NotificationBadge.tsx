'use client';
import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import { BellIcon } from 'lucide-react';
import Link from 'next/link';

export default function NotificationBadge({ mobile = false }: { mobile?: boolean }) {
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <Link
      href="/notifications"
      className={`relative flex items-center gap-2 hover:text-ig-red transition-colors ${
        mobile ? 'flex-col text-xs' : ''
      }`}
    >
      <div className="relative">
        <BellIcon className="size-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-ig-orange to-ig-red text-white text-[10px] font-bold rounded-full size-4 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      {!mobile && <span>Notifications</span>}
    </Link>
  );
}
