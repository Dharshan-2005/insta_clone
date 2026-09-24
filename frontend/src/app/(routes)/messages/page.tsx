import type { Metadata } from 'next';
import Messenger from '@/components/Messenger';
import { serverApi } from '@/lib/server-api';
import type { Conversation } from '@/lib/types';

export const metadata: Metadata = { title: 'Messages' };

export default async function MessagesPage({ searchParams }: { searchParams: { user?: string } }) {
  const conversations = await serverApi<Conversation[]>('/messages/conversations');
  return <Messenger initialConversations={conversations} openUserId={searchParams.user} />;
}
