import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Notification } from '../types';
import { DEMO_NOTIFICATIONS } from '../data/demo';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: Omit<Notification, 'id' | 'created_at'>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isDemo } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) { setNotifications([]); return; }

    if (isDemo) {
      setNotifications(DEMO_NOTIFICATIONS);
      return;
    }

    // Supabase'dan yuklash
    if (isSupabaseConfigured && supabase) {
      loadNotifications();

      // Real-time subscription
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        })
        .subscribe();

      return () => { supabase?.removeChannel(channel); };
    }
  }, [user, isDemo]);

  const loadNotifications = async () => {
    if (!supabase || !user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data as Notification[]);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    if (isSupabaseConfigured && supabase) {
      supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    if (isSupabaseConfigured && supabase && user) {
      supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    }
  };

  const addNotification = (notif: Omit<Notification, 'id' | 'created_at'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
