"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  MessageSquare, 
  Users, 
  CalendarClock, 
  ArrowRight,
  CheckCheck,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { notificationAPI, type Notification } from '@/lib/notification-api';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import type { RealtimeChannel } from '@supabase/supabase-js';

type NotificationType = 'message' | 'lead' | 'schedule' | 'followup' | 'system';

interface NotificationUI extends Notification {
  timeAgo: string;
  unread: boolean;
  avatar?: string;
}

export function EliteNotificationCenter() {
  const router = useRouter();
  const { user } = useAuthSession();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'messages' | 'leads' | 'schedule'>('all');
  const [notifications, setNotifications] = useState<NotificationUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load notifications
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, activeFilter]);

  // Load unread count on mount
  useEffect(() => {
    loadUnreadCount();
    
    // Only poll if realtime is NOT connected (fallback mechanism)
    if (!realtimeConnected) {
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [realtimeConnected]);

  // Setup Supabase Realtime subscription for live notifications
  useEffect(() => {
    if (!user?.id) return;

    const supabase = getSupabaseBrowserClient();
    
    console.log('[Notifications Realtime] Setting up subscription for user:', user.id);
    
    const channel = supabase
      .channel(`notifications:${user.id}`, {
        config: {
          broadcast: { self: true },
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 [Notifications Realtime] NEW NOTIFICATION:', payload);
          
          const newNotification = payload.new as Notification;
          const transformed: NotificationUI = {
            ...newNotification,
            timeAgo: formatTimeAgo(newNotification.created_at),
            unread: !newNotification.read,
            avatar: newNotification.extra_data?.avatar as string | undefined,
          };
          
          // Add to notifications list (prepend)
          setNotifications(prev => [transformed, ...prev]);
          
          // Increment unread count
          setUnreadCount(prev => prev + 1);
          
          // Optional: Show browser notification if permission granted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.description,
              icon: '/logo.png',
              tag: newNotification.id,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('✏️ [Notifications Realtime] NOTIFICATION UPDATED:', payload);
          
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => 
              n.id === updatedNotification.id 
                ? {
                    ...updatedNotification,
                    timeAgo: formatTimeAgo(updatedNotification.created_at),
                    unread: !updatedNotification.read,
                    avatar: updatedNotification.extra_data?.avatar as string | undefined,
                  }
                : n
            )
          );
          
          // Update unread count if read status changed
          if (updatedNotification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[Notifications Realtime] Status:', status, 'Error:', err);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [Notifications Realtime] LIVE - Real-time working!');
          setRealtimeConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ [Notifications Realtime] Error - Using polling fallback');
          setRealtimeConnected(false);
        }
        
        if (err) {
          console.error('❌ [Notifications Realtime] Error:', err);
          setRealtimeConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[Notifications Realtime] Cleaning up subscription');
      setRealtimeConnected(false);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      let typeFilter: string | undefined;
      if (activeFilter === 'messages') typeFilter = 'message';
      else if (activeFilter === 'leads') typeFilter = 'lead';
      else if (activeFilter === 'schedule') typeFilter = 'schedule,followup';
      
      const data = await notificationAPI.listNotifications(typeFilter, false, 50);
      
      const transformed: NotificationUI[] = data.map(n => ({
        ...n,
        timeAgo: formatTimeAgo(n.created_at),
        unread: !n.read,
        avatar: n.extra_data?.avatar as string | undefined,
      }));
      
      setNotifications(transformed);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await notificationAPI.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAsRead();
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const markOneAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead([notificationId]);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, unread: false } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: NotificationUI) => {
    // Mark as read
    if (notification.unread) {
      markOneAsRead(notification.id);
    }
    
    // Navigate if action URL exists
    if (notification.action_url) {
      setIsOpen(false);
      router.push(notification.action_url);
    }
  };

  const formatTimeAgo = (isoDate: string): string => {
    const now = Date.now();
    const date = new Date(isoDate);
    const diff = now - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return '1d ago';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'messages') return n.type === 'message';
    if (activeFilter === 'leads') return n.type === 'lead';
    if (activeFilter === 'schedule') return n.type === 'schedule' || n.type === 'followup';
    return true;
  });

  const getIconAndColors = (type: NotificationType) => {
    switch (type) {
      case 'lead':
        return { icon: Users, colors: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
      case 'message':
        return { icon: MessageSquare, colors: 'text-sky-400 bg-sky-400/10 border-sky-400/20' };
      case 'schedule':
        return { icon: CalendarClock, colors: 'text-violet-400 bg-violet-400/10 border-violet-400/20' };
      case 'followup':
        return { icon: ClipboardList, colors: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
      case 'system':
      default:
        return { icon: Sparkles, colors: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' };
    }
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'messages', label: 'Messages' },
    { id: 'leads', label: 'Leads' },
    { id: 'schedule', label: 'Schedule' },
  ] as const;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-in zoom-in">
              {unreadCount}
            </span>
          )}
          {/* Real-time connection indicator */}
          {realtimeConnected && (
            <span className="absolute left-0 bottom-0 size-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        className="w-full sm:max-w-md p-0 bg-[#0a0f1e]/95 backdrop-blur-2xl border-l border-white/10 flex flex-col h-full !text-white"
      >
        <SheetHeader className="p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-xl font-semibold bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Notification Center
              </SheetTitle>
              {realtimeConnected && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                  <div className="size-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-medium text-emerald-400">LIVE</span>
                </div>
              )}
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 h-8 px-2"
              >
                <CheckCheck className="size-3.5 mr-1.5" />
                Mark all read
              </Button>
            )}
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 mt-6 bg-white/5 p-1 rounded-xl">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-300",
                  activeFilter === tab.id 
                    ? "bg-white/10 text-white shadow-sm" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-zinc-500 text-sm">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => {
              const { icon: Icon, colors } = getIconAndColors(notification.type);
              
              return (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
                    notification.unread 
                      ? "bg-linear-to-br from-white/10 to-white/5 border-white/20 shadow-lg shadow-black/20" 
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                  )}
                >
                  {/* Unread indicator bar */}
                  {notification.unread && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  )}
                  
                  <div className="flex gap-4">
                    <div className="shrink-0 relative">
                      {notification.avatar ? (
                        <Avatar className={cn(
                          "size-10 border-2",
                          notification.unread ? "border-emerald-500/50" : "border-white/10"
                        )}>
                          <AvatarFallback className="bg-linear-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-400 font-medium">
                            {notification.avatar}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={cn("size-10 rounded-full flex items-center justify-center border", colors)}>
                          <Icon className="size-5" />
                        </div>
                      )}
                      
                      {/* Sub-icon for avatars to show type context */}
                      {notification.avatar && notification.type === 'message' && (
                        <div className="absolute -bottom-1 -right-1 size-4 bg-sky-500 rounded-full flex items-center justify-center border-2 border-[#0a0f1e]">
                          <MessageSquare className="size-2 text-white" />
                        </div>
                      )}
                      {notification.avatar && notification.type === 'lead' && (
                        <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0a0f1e]">
                          <Users className="size-2 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={cn(
                          "text-sm font-semibold truncate",
                          notification.unread ? "text-white" : "text-zinc-300"
                        )}>
                          {notification.title}
                        </p>
                        <span className={cn(
                          "text-[10px] whitespace-nowrap",
                          notification.unread ? "text-emerald-400 font-medium" : "text-zinc-500"
                        )}>
                          {notification.timeAgo}
                        </span>
                      </div>
                      
                      <p className={cn(
                        "text-sm leading-relaxed",
                        notification.unread ? "text-zinc-300" : "text-zinc-500"
                      )}>
                        {notification.description}
                      </p>
                      
                      {notification.action_text && (
                        <button className={cn(
                          "mt-3 text-xs font-medium flex items-center gap-1.5 transition-colors group/btn",
                          notification.type === 'lead' ? "text-emerald-400 hover:text-emerald-300" :
                          notification.type === 'message' ? "text-sky-400 hover:text-sky-300" :
                          notification.type === 'schedule' ? "text-violet-400 hover:text-violet-300" :
                          notification.type === 'followup' ? "text-amber-400 hover:text-amber-300" :
                          "text-zinc-300 hover:text-white"
                        )}>
                          {notification.action_text}
                          <ArrowRight className="size-3 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Bell className="size-8 text-zinc-500" />
              </div>
              <p className="text-white font-medium mb-1">All caught up!</p>
              <p className="text-sm text-zinc-500">You don't have any notifications in this category right now.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
