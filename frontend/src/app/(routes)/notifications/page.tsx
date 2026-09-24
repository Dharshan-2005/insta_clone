import { Heart } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import MarkNotificationsRead from '@/components/MarkNotificationsRead';
import TimeAgo from '@/components/TimeAgo';
import { serverApi } from '@/lib/server-api';
import type { Notification } from '@/lib/types';

export const metadata: Metadata = { title: 'Notifications' };

function describe(notification: Notification) {
  switch (notification.type) {
    case 'like':
      return 'liked your post.';
    case 'comment':
      return `commented: ${notification.text ?? ''}`;
    case 'follow':
      return 'started following you.';
  }
}

export default async function NotificationsPage() {
  const notifications = await serverApi<Notification[]>('/notifications');

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <MarkNotificationsRead />
      <h1 className="mb-6 text-xl font-semibold">Notifications</h1>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-neutral-200">
            <Heart className="size-8" strokeWidth={1.4} />
          </div>
          <p className="font-semibold">Activity on your posts</p>
          <p className="text-sm text-neutral-400">When someone likes, comments on or follows you, you&apos;ll see it here.</p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Link
                href={notification.postId ? `/posts/${notification.postId}` : `/users/${notification.actor.username}`}
                className={`flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-neutral-900 ${
                  notification.read ? '' : 'bg-neutral-900/60'
                }`}
              >
                <Avatar user={notification.actor} size={44} />
                <p className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold">{notification.actor.username}</span> {describe(notification)}{' '}
                  <TimeAgo date={notification.createdAt} className="text-neutral-500" />
                </p>
                {!notification.read && <span className="size-2 shrink-0 rounded-full bg-sky-500" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
