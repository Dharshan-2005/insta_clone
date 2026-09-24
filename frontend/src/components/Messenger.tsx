'use client';

import { ChevronLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { Conversation, Message } from '@/lib/types';
import Avatar from './Avatar';
import { useCurrentUser } from './CurrentUser';
import TimeAgo from './TimeAgo';
import UserSearch from './UserSearch';

type Props = {
  initialConversations: Conversation[];
  openUserId?: string;
};

const appendUnique = (messages: Message[], message: Message) =>
  messages.some((m) => m.id === message.id) ? messages : [...messages, message];

export default function Messenger({ initialConversations, openUserId }: Props) {
  const me = useCurrentUser();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const activeIdRef = useRef(activeId);
  const bottomRef = useRef<HTMLDivElement>(null);
  activeIdRef.current = activeId;

  const refreshConversations = useCallback(async () => {
    try {
      setConversations(await api.get<Conversation[]>('/messages/conversations'));
    } catch {
      return;
    }
  }, []);

  const markRead = useCallback(async (conversationId: string) => {
    await api.post(`/messages/conversations/${conversationId}/read`).catch(() => undefined);
    setConversations((current) => current.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
  }, []);

  const openWith = useCallback(
    async (userId: string) => {
      setError(null);
      try {
        const { id } = await api.post<{ id: string }>('/messages/conversations', { userId });
        await refreshConversations();
        setActiveId(id);
      } catch (err) {
        setError(errorMessage(err));
      }
    },
    [refreshConversations],
  );

  useEffect(() => {
    if (openUserId) openWith(openUserId);
  }, [openUserId, openWith]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    api
      .get<Message[]>(`/messages/conversations/${activeId}/messages`)
      .then((list) => !cancelled && setMessages(list))
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    markRead(activeId);
    return () => {
      cancelled = true;
    };
  }, [activeId, markRead]);

  useEffect(() => {
    const socket = getSocket();
    const onMessage = async (message: Message) => {
      if (message.conversationId === activeIdRef.current) {
        setMessages((current) => appendUnique(current, message));
        if (message.senderId !== me.id) await markRead(message.conversationId);
      }
      refreshConversations();
    };
    socket.on('message', onMessage);
    return () => {
      socket.off('message', onMessage);
    };
  }, [me.id, markRead, refreshConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || !activeId) return;
    setText('');
    setError(null);
    try {
      const message = await api.post<Message>(`/messages/conversations/${activeId}/messages`, { text: body });
      setMessages((current) => appendUnique(current, message));
      refreshConversations();
    } catch (err) {
      setText(body);
      setError(errorMessage(err));
    }
  };

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex h-[calc(100dvh-3rem)] md:h-screen">
      <section
        className={`${active ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-neutral-800 md:w-96`}
      >
        <div className="flex flex-col gap-4 p-5">
          <h1 className="text-xl font-semibold">{me.username}</h1>
          <UserSearch placeholder="Search people to message" onSelect={(user) => openWith(user.id)} />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <li className="p-6 text-center text-sm text-neutral-500">No messages yet. Search for someone to start chatting.</li>
          )}
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => setActiveId(conversation.id)}
                className={`flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-neutral-900 ${
                  conversation.id === activeId ? 'bg-neutral-900' : ''
                }`}
              >
                <Avatar user={conversation.participant} size={52} />
                <div className="min-w-0 flex-1 text-sm">
                  <p className={conversation.unreadCount > 0 ? 'font-bold' : 'font-medium'}>
                    {conversation.participant.name ?? conversation.participant.username}
                  </p>
                  {conversation.lastMessage && (
                    <p className={`truncate ${conversation.unreadCount > 0 ? 'text-white' : 'text-neutral-400'}`}>
                      {conversation.lastMessage.senderId === me.id ? 'You: ' : ''}
                      {conversation.lastMessage.text} ·{' '}
                      <TimeAgo date={conversation.lastMessage.createdAt} />
                    </p>
                  )}
                </div>
                {conversation.unreadCount > 0 && <span className="size-2 rounded-full bg-sky-500" />}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${active ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {active ? (
          <>
            <header className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3">
              <button type="button" onClick={() => setActiveId(null)} className="md:hidden" aria-label="Back">
                <ChevronLeft className="size-6" />
              </button>
              <Link href={`/users/${active.participant.username}`} className="flex items-center gap-3">
                <Avatar user={active.participant} size={40} />
                <div className="text-sm leading-tight">
                  <p className="font-semibold">{active.participant.name ?? active.participant.username}</p>
                  <p className="text-neutral-400">{active.participant.username}</p>
                </div>
              </Link>
            </header>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
              {!loading && messages.length === 0 && (
                <p className="m-auto text-sm text-neutral-500">Say hi to {active.participant.username} 👋</p>
              )}
              {messages.map((message) => {
                const mine = message.senderId === me.id;
                return (
                  <div
                    key={message.id}
                    title={new Date(message.createdAt).toLocaleString()}
                    className={`max-w-[75%] whitespace-pre-line break-words rounded-2xl px-4 py-2 text-sm ${
                      mine ? 'self-end bg-sky-600' : 'self-start bg-neutral-800'
                    }`}
                  >
                    {message.text}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {error && <p className="px-4 text-xs text-rose-400">{error}</p>}
            <form onSubmit={send} className="flex items-center gap-3 border-t border-neutral-800 p-3">
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={2000}
                placeholder="Message…"
                className="flex-1 rounded-full border border-neutral-800 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-neutral-600"
              />
              <button type="submit" disabled={!text.trim()} aria-label="Send" className="text-sky-400 disabled:opacity-40">
                <Send className="size-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="m-auto flex flex-col items-center gap-3 text-center">
            <div className="flex size-24 items-center justify-center rounded-full border-2 border-neutral-200">
              <Send className="size-10" strokeWidth={1.4} />
            </div>
            <p className="text-xl">Your messages</p>
            <p className="text-sm text-neutral-400">Send private messages to a friend.</p>
            {error && <p className="text-xs text-rose-400">{error}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
