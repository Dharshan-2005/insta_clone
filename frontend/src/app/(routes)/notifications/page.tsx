'use client';
import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import { getMediaUrl } from '@/lib/api/client';
import { Avatar, Button } from '@radix-ui/themes';
import { BellIcon, CheckCheckIcon, HeartIcon, MessageCircleIcon, UserPlusIcon } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const { notifications, loading, fetchNotifications, markRead, markAllRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return <HeartIcon className="size-4 text-ig-red fill-ig-red" />;
      case 'COMMENT':
        return <MessageCircleIcon className="size-4 text-blue-500 fill-blue-500" />;
      case 'FOLLOW':
        return <UserPlusIcon className="size-4 text-emerald-500" />;
      default:
        return <BellIcon className="size-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
          <p className="text-sm text-gray-500">Activity and interactions across your account</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button
            variant="soft"
            color="ruby"
            size="2"
            onClick={() => markAllRead()}
            className="cursor-pointer flex items-center gap-1.5"
          >
            <CheckCheckIcon className="size-4" />
            Mark all read
          </Button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-900">
              <div className="size-12 bg-gray-200 dark:bg-zinc-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
          <div className="size-16 mx-auto rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-ig-red mb-4">
            <BellIcon className="size-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No notifications yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            When people like your photos, comment on your posts, or follow you, you'll see them here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.read && markRead(notif.id)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                notif.read
                  ? 'bg-white dark:bg-zinc-900/40 border-gray-100 dark:border-zinc-800/80 hover:border-gray-200 dark:hover:border-zinc-700'
                  : 'bg-red-50/40 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <Avatar
                    radius="full"
                    src={getMediaUrl(notif.actor?.avatar)}
                    size="3"
                    fallback={notif.actor?.username?.[0]?.toUpperCase() || 'U'}
                  />
                  <div className="absolute -bottom-1 -right-1 size-5 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow">
                    {getIcon(notif.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    <Link
                      href={`/users/${notif.actor?.username || ''}`}
                      className="font-bold hover:underline mr-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {notif.actor?.username || 'user'}
                    </Link>
                    {notif.message}
                  </p>
                  <span className="text-xs text-gray-400 mt-0.5 block">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {notif.postId && (
                <Link
                  href={`/posts/${notif.postId}`}
                  className="size-12 ml-4 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100 dark:border-zinc-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-full h-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-xs text-gray-500">
                    Post
                  </div>
                </Link>
              )}

              {!notif.read && (
                <div className="size-2 ml-3 rounded-full bg-ig-red flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
