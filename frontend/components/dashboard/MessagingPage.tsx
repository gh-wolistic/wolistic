'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  MessageSquarePlus,
  Send,
  Check,
  CheckCheck,
  Clock,
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  MessageCircle,
  Search,
  Image as ImageIcon,
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { messagingAPI, type Message, type ConversationWithLastMessage } from '@/lib/messaging-api';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UIMessage extends Message {
  status: 'sending' | 'sent' | 'read';
}

interface UIConversation extends Omit<ConversationWithLastMessage, 'last_message'> {
  user_id: string;
  user_name: string;
  user_initials: string;
  is_online: boolean;
  last_seen?: Date;
  messages: UIMessage[];
  last_message: Message | null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function EliteGlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-violet-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  );
}

function ConversationCard({
  conversation,
  isActive,
  onClick
}: {
  conversation: UIConversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const lastMessageTime = conversation.last_message_at ? new Date(conversation.last_message_at) : new Date();
  const lastMessageText = conversation.last_message?.content || 'No messages yet';

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer rounded-xl border transition-all duration-300 overflow-hidden ${
        isActive
          ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-400/30 shadow-lg shadow-emerald-500/10'
          : 'bg-gradient-to-br from-white/[0.05] to-white/[0.02] border-white/10 hover:border-emerald-400/20 hover:from-white/[0.08] hover:to-white/[0.03]'
      }`}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
      )}

      <div className="relative p-4 flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <Avatar className="size-14 border-2 border-white/20 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 text-emerald-400 font-semibold text-base">
              {conversation.user_initials}
            </AvatarFallback>
          </Avatar>
          {conversation.is_online && (
            <div className="absolute bottom-0 right-0 size-4 bg-emerald-500 rounded-full border-2 border-[#0a0f1e] shadow-lg shadow-emerald-500/50 animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h4 className="font-semibold text-white truncate">{conversation.user_name}</h4>
            <span className="text-xs text-zinc-500 flex-shrink-0 font-medium">
              {formatTime(lastMessageTime)}
            </span>
          </div>
          <p
            className={`text-sm truncate ${
              conversation.unread_count > 0 ? 'font-semibold text-white' : 'text-zinc-400'
            }`}
          >
            {lastMessageText}
          </p>
        </div>

        {conversation.unread_count > 0 && (
          <Badge className="size-6 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xs font-bold p-0 shadow-lg shadow-emerald-500/30 animate-in zoom-in-95">
            {conversation.unread_count}
          </Badge>
        )}
      </div>
    </div>
  );
}

function ConversationListPanel({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewMessage
}: {
  conversations: UIConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewMessage: () => void;
}) {
  return (
    <div className="flex flex-col h-full border-r border-white/10 bg-white/[0.02]">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
            Messages
          </h2>
          <Button
            size="icon"
            variant="ghost"
            className="size-10 text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-300 transition-all rounded-xl"
            onClick={onNewMessage}
          >
            <MessageSquarePlus className="size-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/30 transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length > 0 ? (
          <div className="p-3 space-y-2">
            {conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversationId === conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            <div className="rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-6 mb-4 border border-emerald-400/20">
              <MessageCircle className="size-10 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white mb-2 text-lg">No conversations yet</h3>
            <p className="text-sm text-zinc-400 mb-6 max-w-xs">Start connecting with your clients and build meaningful relationships</p>
            <Button
              onClick={onNewMessage}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              <MessageSquarePlus className="size-4 mr-2" />
              New Message
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isSent,
  showAvatar,
  userInitials,
  isGroupedWithPrevious
}: {
  message: UIMessage;
  isSent: boolean;
  showAvatar: boolean;
  userInitials: string;
  isGroupedWithPrevious: boolean;
}) {
  const StatusIcon = message.status === 'sending' ? Clock : message.status === 'read' ? CheckCheck : Check;

  return (
    <div className={`flex items-end gap-2.5 ${isSent ? 'flex-row-reverse' : 'flex-row'} ${isGroupedWithPrevious ? 'mt-1' : 'mt-5'} animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}>
      {!isSent && (
        <div className="flex-shrink-0 size-9">
          {showAvatar && (
            <Avatar className="size-9 border-2 border-white/20 shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 text-emerald-400 text-xs font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-[75%] sm:max-w-md`}>
        <div
          className={`px-4 py-3 shadow-lg relative ${
            isSent
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl rounded-br-md shadow-emerald-500/20'
              : 'bg-gradient-to-br from-white/10 to-white/5 text-white border border-white/10 rounded-2xl rounded-bl-md backdrop-blur-xl'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`flex items-center gap-1.5 mt-1.5 px-2 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-zinc-500 font-medium">
            {new Date(message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>
          {isSent && (
            <StatusIcon className={`size-3.5 ${message.status === 'read' ? 'text-emerald-400' : 'text-zinc-500'}`} />
          )}
        </div>
      </div>
    </div>
  );
}

function DateDivider({ date }: { date: Date }) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="px-4 py-1.5 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl text-xs font-medium text-zinc-400">
        {formatDate(date)}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

function TypingIndicator({ userInitials }: { userInitials: string }) {
  return (
    <div className="flex items-end gap-2.5 mt-5 animate-in fade-in-0 duration-300">
      <Avatar className="size-9 border-2 border-white/20 shadow-md">
        <AvatarFallback className="bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 text-emerald-400 text-xs font-semibold">
          {userInitials}
        </AvatarFallback>
      </Avatar>
      <div className="px-5 py-3 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl rounded-bl-md backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="size-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="size-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="size-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function MessageThreadPanel({
  conversation,
  currentUserId,
  onBack,
  onSendMessage
}: {
  conversation: UIConversation | null;
  currentUserId: string;
  onBack: () => void;
  onSendMessage: (text: string) => void;
}) {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && conversation) {
      const scrollContainer = scrollRef.current;
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;

      if (isNearBottom || conversation.messages.length <= 1) {
        setTimeout(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [conversation?.messages]);

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-full w-full bg-transparent">
        <div className="p-12 text-center max-w-md bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-xl">
          <div className="rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-8 mb-6 mx-auto w-fit border border-emerald-400/20">
            <MessageCircle className="size-16 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">Select a conversation</h3>
          <p className="text-sm text-zinc-400">Choose a conversation from the list to view messages and start chatting</p>
        </div>
      </div>
    );
  }

  // Group messages by date and check if consecutive
  const groupedMessages: Array<{ type: 'date'; date: Date } | { type: 'message'; message: UIMessage; showAvatar: boolean; isGrouped: boolean }> = [];
  let lastDate: Date | null = null;
  let lastSenderId: string | null = null;
  let lastTimestamp: Date | null = null;

  conversation.messages.forEach((message, index) => {
    const messageDate = new Date(message.created_at);
    const messageDateStr = messageDate.toDateString();

    if (!lastDate || lastDate.toDateString() !== messageDateStr) {
      groupedMessages.push({ type: 'date', date: messageDate });
      lastDate = messageDate;
    }

    const isGrouped =
      lastSenderId === message.sender_id &&
      lastTimestamp &&
      (messageDate.getTime() - lastTimestamp.getTime()) < 120000; // 2 minutes

    const isLastInGroup =
      index === conversation.messages.length - 1 ||
      conversation.messages[index + 1].sender_id !== message.sender_id ||
      (new Date(conversation.messages[index + 1].created_at).getTime() - messageDate.getTime()) >= 120000;

    groupedMessages.push({
      type: 'message',
      message,
      showAvatar: !isGrouped || isLastInGroup,
      isGrouped
    });

    lastSenderId = message.sender_id;
    lastTimestamp = messageDate;
  });

  return (
    <div className="flex flex-col h-full bg-transparent w-full relative">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden size-10 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            onClick={onBack}
          >
            <ChevronLeft className="size-5" />
          </Button>

          <div className="relative flex-shrink-0">
            <Avatar className="size-12 border-2 border-white/20 shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 text-emerald-400 font-semibold text-lg">
                {conversation.user_initials}
              </AvatarFallback>
            </Avatar>
            {conversation.is_online && (
              <div className="absolute bottom-0 right-0 size-3.5 bg-emerald-500 rounded-full border-2 border-[#0a0f1e] shadow-lg shadow-emerald-500/50 animate-pulse" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-lg truncate">{conversation.user_name}</h3>
            <p className="text-xs font-medium text-emerald-400">
              {conversation.is_online
                ? 'Active now'
                : conversation.last_seen
                ? `Last seen ${conversation.last_seen.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                : 'Offline'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="size-10 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all">
              <Phone className="size-5" />
            </Button>
            <Button size="icon" variant="ghost" className="size-10 text-zinc-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-xl transition-all">
              <Video className="size-5" />
            </Button>
            <Button size="icon" variant="ghost" className="size-10 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
              <MoreVertical className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
        {groupedMessages.map((item, index) => {
          if (item.type === 'date') {
            return <DateDivider key={`date-${index}`} date={item.date} />;
          } else {
            return (
              <MessageBubble
                key={item.message.id}
                message={item.message}
                isSent={item.message.sender_id === currentUserId}
                showAvatar={item.showAvatar}
                userInitials={conversation.user_initials}
                isGroupedWithPrevious={item.isGrouped}
              />
            );
          }
        })}

        {isTyping && <TypingIndicator userInitials={conversation.user_initials} />}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-5 border-t border-white/10">
        <div className="flex items-end gap-3">
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="size-10 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all flex-shrink-0"
            >
              <Paperclip className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-10 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all flex-shrink-0"
            >
              <ImageIcon className="size-5" />
            </Button>
          </div>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-12 max-h-32 resize-none bg-white/5 border-white/10 focus-visible:ring-emerald-400 focus-visible:border-emerald-400/30 rounded-xl text-white placeholder:text-zinc-500 pr-14"
            />
            <Button
              size="icon"
              disabled={!messageText.trim()}
              onClick={handleSend}
              className="absolute right-2 bottom-2 size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessagingPage() {
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      // Fetch up to 50 conversations (default), use cache
      const data = await messagingAPI.listConversations(50, true);
      
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setConversations([]);
        return;
      }
      
      // Transform backend data to UI format
      const uiConversations: UIConversation[] = await Promise.all(
        data.map(async (conv) => {
          // Get the other participant
          const otherParticipant = conv.participants.find(p => p.user_id !== user.id);
          const otherUserId = otherParticipant?.user_id || '';
          
          // Use user_profile from backend if available, otherwise fetch from Supabase
          let userName = otherParticipant?.user_profile?.name;
          
          if (!userName) {
            // Fallback to Supabase query if profile not loaded
            const { data: userData } = await supabase
              .from('users')
              .select('full_name, email')
              .eq('id', otherUserId)
              .single();
            
            userName = userData?.full_name || userData?.email || `User ${otherUserId.slice(0, 8)}`;
          }
          
          // Load messages for this conversation
          const messages = await messagingAPI.getMessages(conv.id);
          
          return {
            ...conv,
            user_id: otherUserId,
            user_name: userName,
            user_initials: getInitials(userName),
            is_online: false, // TODO: Implement online status
            messages: messages.map(msg => ({
              ...msg,
              status: 'read' as const
            }))
          };
        })
      );
      
      setConversations(uiConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Polling fallback to fetch new messages
  const pollMessages = async () => {
    if (!activeConversationId) return;
    
    try {
      const messages = await messagingAPI.getMessages(activeConversationId);
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === activeConversationId) {
            // Only update if we have new messages
            const existingIds = new Set(conv.messages.map(m => m.id));
            const newMessages = messages.filter(m => !existingIds.has(m.id));
            
            if (newMessages.length > 0) {
              console.log('[Polling] Found', newMessages.length, 'new messages');
              return {
                ...conv,
                messages: messages.map(m => ({ ...m, status: 'read' as const })),
                last_message: messages[messages.length - 1] || conv.last_message,
              };
            }
          }
          return conv;
        })
      );
    } catch (error) {
      console.error('[Polling] Failed to fetch messages:', error);
    }
  };

  // Setup polling as fallback (every 3 seconds)
  useEffect(() => {
    if (!activeConversationId) return;

    console.log('[Polling] Starting message polling for conversation:', activeConversationId);
    
    // Poll immediately
    pollMessages();
    
    // Then poll every 3 seconds
    pollingIntervalRef.current = setInterval(pollMessages, 3000);

    return () => {
      console.log('[Polling] Stopping message polling');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeConversationId]);

  // Setup Supabase realtime subscriptions (attempt, fallback to polling if fails)
  useEffect(() => {
    if (!activeConversationId || !currentUserId) return;

    const supabase = getSupabaseBrowserClient();
    
    console.log('[Realtime] Attempting to set up subscription for conversation:', activeConversationId);
    console.log('[Realtime] IMPORTANT: Make sure you ran "ALTER PUBLICATION supabase_realtime ADD TABLE messages;" in Supabase SQL Editor!');
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation:${activeConversationId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: currentUserId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`
        },
        (payload) => {
          console.log('🎉 [Realtime] NEW MESSAGE RECEIVED VIA REALTIME:', payload);
          const newMessage = payload.new as Message;
          
          // Only add if from another user (avoid duplicates from optimistic updates)
          if (newMessage.sender_id !== currentUserId) {
            setConversations(prev =>
              prev.map(conv => {
                if (conv.id === activeConversationId) {
                  // Check if message already exists
                  const messageExists = conv.messages.some(m => m.id === newMessage.id);
                  if (messageExists) {
                    console.log('[Realtime] Message already exists, skipping duplicate');
                    return conv;
                  }
                  
                  console.log('[Realtime] Adding new message to UI');
                  return {
                    ...conv,
                    messages: [...conv.messages, { ...newMessage, status: 'read' as const }],
                    last_message: newMessage,
                    last_message_at: newMessage.created_at,
                    unread_count: 0
                  };
                }
                return conv;
              })
            );
          } else {
            console.log('[Realtime] Message from current user, skipping (optimistic update already applied)');
          }
        }
      )
      .on('subscribe', (status, err) => {
        console.log('[Realtime] Subscribe callback - Status:', status, 'Error:', err);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [Realtime] SUCCESSFULLY SUBSCRIBED - Real-time is working!');
          setRealtimeConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [Realtime] Channel error - Real-time will NOT work. Using polling fallback.');
          setRealtimeConnected(false);
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ [Realtime] Connection timed out - Using polling fallback.');
          setRealtimeConnected(false);
        }
      })
      .subscribe((status, err) => {
        console.log('[Realtime] Initial subscribe - Status:', status, 'Error:', err);
        if (err) {
          console.error('❌ [Realtime] Subscription error:', err);
          console.error('[Realtime] Make sure you ran: ALTER PUBLICATION supabase_realtime ADD TABLE messages;');
          setRealtimeConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[Realtime] Cleaning up subscription');
      setRealtimeConnected(false);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [activeConversationId, currentUserId]);

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    setShowMobileThread(true);

    // Mark conversation as read
    try {
      await messagingAPI.markConversationRead(id);
      setConversations(prev =>
        prev.map(conv =>
          conv.id === id ? { ...conv, unread_count: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  const handleBack = () => {
    setShowMobileThread(false);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversationId || !currentUserId) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: UIMessage = {
      id: tempId,
      conversation_id: activeConversationId,
      sender_id: currentUserId,
      content: text,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      status: 'sending'
    };

    // Optimistically add message
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, tempMessage],
            last_message: tempMessage,
            last_message_at: tempMessage.created_at
          };
        }
        return conv;
      })
    );

    try {
      const sentMessage = await messagingAPI.sendMessage(activeConversationId, text);
      
      // Replace temp message with real message
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === tempId ? { ...sentMessage, status: 'sent' as const } : msg
              )
            };
          }
          return conv;
        })
      );

      // Simulate read status after 2 seconds
      setTimeout(() => {
        setConversations(prev =>
          prev.map(conv => {
            if (conv.id === activeConversationId) {
              return {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === sentMessage.id ? { ...msg, status: 'read' as const } : msg
                )
              };
            }
            return conv;
          })
        );
      }, 2000);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: conv.messages.filter(msg => msg.id !== tempId)
            };
          }
          return conv;
        })
      );
    }
  };

  const handleNewMessage = () => {
    // TODO: Implement new message functionality
    console.log('New message clicked');
  };

  if (loading) {
    return (
      <div className="relative h-full w-full overflow-hidden flex items-center justify-center bg-[#0a0f1e]">
        <div className="text-white">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0f1e]">
      {/* Realtime status indicator */}
      {realtimeConnected && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-sm">
          <div className="size-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-300 font-medium">Live</span>
        </div>
      )}
      
      <div className="relative h-full w-full">
        <div className="h-full flex w-full bg-gradient-to-br from-white/[0.04] to-transparent backdrop-blur-xl overflow-hidden relative shadow-2xl">
          {/* Conversation List - Desktop: always visible, Mobile: hidden when thread is shown */}
          <div className={`${showMobileThread ? 'hidden' : 'block'} md:block w-full md:w-80 lg:w-96 shrink-0 h-full`}>
            <ConversationListPanel
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onNewMessage={handleNewMessage}
            />
          </div>

          {/* Message Thread - Desktop: always visible, Mobile: shown when conversation selected */}
          <div className={`${showMobileThread ? 'block' : 'hidden'} md:block flex-1 h-full min-w-0 bg-black/15`}>
            <MessageThreadPanel
              conversation={activeConversation}
              currentUserId={currentUserId}
              onBack={handleBack}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
