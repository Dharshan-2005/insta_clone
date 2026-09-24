'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Send,
  Search,
  Smile,
  Image as ImageIcon,
  Heart,
  Phone,
  Video,
  Info,
  ChevronLeft,
  Check,
  CheckCheck,
  Circle,
  MoreVertical,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { getMediaUrl } from '@/lib/api/client';
import { apiFetch } from '@/lib/api';
import { getNotificationSocket } from '@/lib/ws';
import { useSession } from 'next-auth/react';

interface RealMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  type: string;
  mediaPath?: string;
  read: boolean;
  createdAt: string;
}

interface ConversationItem {
  id: string;
  updatedAt: string;
  participant: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
  };
  lastMessage?: {
    id: string;
    text: string;
    senderId: string;
    type: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export default function MessagesPage() {
  const sessionRes = useSession();
  const session = sessionRes?.data;
  const currentUserId = (session?.user as any)?.id || (session?.user as any)?.userId || '';

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RealMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPeerTyping]);

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/messages/conversations');
      const list: ConversationItem[] = Array.isArray(data) ? data : data?.data || [];
      setConversations(list);
      if (list.length > 0 && !activeConvId) {
        setActiveConvId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUserId]);

  // Load messages when activeConvId changes
  useEffect(() => {
    if (!activeConvId) return;

    const fetchMessages = async () => {
      try {
        setMessagesLoading(true);
        const data = await apiFetch(`/messages/conversations/${activeConvId}/messages`);
        const list: RealMessage[] = Array.isArray(data) ? data : data?.data || [];
        setMessages(list);

        // Mark read
        apiFetch(`/messages/conversations/${activeConvId}/read`, { method: 'PATCH' }).catch(() => {});
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();

    // Socket subscriptions
    const socket = getNotificationSocket(currentUserId);
    if (socket) {
      socket.emit('join_conversation', { conversationId: activeConvId });

      const handleNewMessage = (msg: RealMessage) => {
        if (msg.conversationId === activeConvId) {
          setMessages((prev) => [...prev, msg]);
          apiFetch(`/messages/conversations/${activeConvId}/read`, { method: 'PATCH' }).catch(() => {});
        }
        loadConversations();
      };

      const handleUserTyping = (data: { conversationId: string; userId: string }) => {
        if (data.conversationId === activeConvId && data.userId !== currentUserId) {
          setIsPeerTyping(true);
        }
      };

      const handleUserStoppedTyping = (data: { conversationId: string; userId: string }) => {
        if (data.conversationId === activeConvId && data.userId !== currentUserId) {
          setIsPeerTyping(false);
        }
      };

      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stopped_typing', handleUserStoppedTyping);

      return () => {
        socket.emit('leave_conversation', { conversationId: activeConvId });
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stopped_typing', handleUserStoppedTyping);
      };
    }
  }, [activeConvId, currentUserId]);

  // Handle user search to start new DM
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        const list = Array.isArray(res) ? res : res?.data || [];
        setSearchResults(list.filter((u: any) => u.userId !== currentUserId && u.id !== currentUserId));
      } catch (err) {
        console.error('User search error:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUserId]);

  const startConversationWithUser = async (targetUser: any) => {
    try {
      const targetId = targetUser.userId || targetUser.id;
      const res = await apiFetch('/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: targetId }),
      });

      const conv = res?.data || res;
      setSearchQuery('');
      setSearchResults([]);
      await loadConversations();
      if (conv?.id) {
        setActiveConvId(conv.id);
        setShowMobileChat(true);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to start conversation');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    const socket = getNotificationSocket(currentUserId);
    if (socket && activeConvId) {
      socket.emit('typing_start', { conversationId: activeConvId, userId: currentUserId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { conversationId: activeConvId, userId: currentUserId });
      }, 2000);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const textToSend = inputText.trim();
    setInputText('');

    const socket = getNotificationSocket(currentUserId);
    if (socket) {
      socket.emit('typing_stop', { conversationId: activeConvId, userId: currentUserId });
    }

    try {
      const res = await apiFetch(`/messages/conversations/${activeConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: textToSend, type: 'text' }),
      });

      const newMsg = res?.data || res;
      if (newMsg?.id) {
        setMessages((prev) => [...prev, newMsg]);
        if (socket) {
          socket.emit('send_message', newMsg);
        }
      }
      loadConversations();
    } catch (err: any) {
      console.error('Failed to send message:', err);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen w-full bg-black text-white overflow-hidden">
      {/* Sidebar: Conversation List */}
      <div
        className={`${
          showMobileChat ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 border-r border-neutral-800 flex-col h-full bg-black`}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Messages</h1>
        </div>

        {/* User Search Bar */}
        <div className="p-3 border-b border-neutral-850 relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search people to message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 text-sm text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-700"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-neutral-900 border border-neutral-800 rounded-b-lg shadow-2xl z-50 max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id || user.userId}
                  onClick={() => startConversationWithUser(user)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-neutral-800 transition-colors text-left"
                >
                  <img
                    src={getMediaUrl(user.avatar)}
                    alt={user.username || 'user'}
                    className="size-10 rounded-full object-cover bg-neutral-800"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">@{user.username}</div>
                    <div className="text-xs text-neutral-400">{user.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-900">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-neutral-500">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-500 gap-3">
              <UserPlus className="size-10 stroke-[1.5] text-neutral-600" />
              <p className="text-sm">No messages yet. Search for a friend above to start chatting!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveConvId(conv.id);
                  setShowMobileChat(true);
                }}
                className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                  activeConvId === conv.id ? 'bg-neutral-900' : 'hover:bg-neutral-900/50'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={getMediaUrl(conv.participant?.avatar)}
                    alt={conv.participant?.username || 'user'}
                    className="size-12 rounded-full object-cover bg-neutral-800"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white truncate">
                      {conv.participant?.name || `@${conv.participant?.username}`}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-[11px] text-neutral-500">
                        {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-neutral-400 truncate max-w-[200px]">
                      {conv.lastMessage?.text || 'Started a conversation'}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="size-4 rounded-full bg-sky-500 text-[10px] font-bold text-white flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat View */}
      <div
        className={`${
          showMobileChat ? 'flex' : 'hidden md:flex'
        } flex-1 flex-col h-full bg-black relative`}
      >
        {activeConv ? (
          <>
            {/* Active Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-black">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden text-neutral-400 hover:text-white p-1"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <Link
                  href={`/users/${activeConv.participant?.username}`}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src={getMediaUrl(activeConv.participant?.avatar)}
                    alt={activeConv.participant?.username}
                    className="size-10 rounded-full object-cover bg-neutral-800"
                  />
                  <div>
                    <h2 className="text-sm font-bold text-white group-hover:underline">
                      {activeConv.participant?.name || `@${activeConv.participant?.username}`}
                    </h2>
                    <span className="text-xs text-neutral-400">
                      @{activeConv.participant?.username}
                    </span>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-4 text-neutral-300">
                <Phone className="size-5 cursor-pointer hover:text-white transition-colors" />
                <Video className="size-5 cursor-pointer hover:text-white transition-colors" />
                <Info className="size-5 cursor-pointer hover:text-white transition-colors" />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center p-8 text-neutral-500">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 gap-2">
                  <p className="text-sm">Say hi to @{activeConv.participant?.username}!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-sky-600 text-white rounded-br-xs'
                            : 'bg-neutral-800 text-neutral-100 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isPeerTyping && (
                <div className="flex items-center gap-2 text-xs text-neutral-400 pl-2">
                  <div className="flex gap-1">
                    <span className="size-1.5 rounded-full bg-neutral-400 animate-bounce" />
                    <span className="size-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="size-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>@{activeConv.participant?.username} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-neutral-800 bg-black flex items-center gap-3"
            >
              <Smile className="size-6 text-neutral-400 hover:text-white cursor-pointer transition-colors flex-shrink-0" />
              <input
                type="text"
                placeholder="Message..."
                value={inputText}
                onChange={handleInputChange}
                className="flex-1 bg-neutral-900 text-sm text-white placeholder-neutral-500 px-4 py-2.5 rounded-full focus:outline-none focus:ring-1 focus:ring-neutral-700"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="text-sky-500 hover:text-sky-400 disabled:opacity-40 disabled:hover:text-sky-500 p-1 flex-shrink-0 transition-opacity"
              >
                <Send className="size-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 p-8">
            <Send className="size-16 stroke-[1] text-neutral-700 mb-4" />
            <h2 className="text-xl font-bold text-white mb-1">Your Messages</h2>
            <p className="text-sm max-w-sm">
              Send private messages to friends on Instagram. Search for someone on the left to start chatting!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
