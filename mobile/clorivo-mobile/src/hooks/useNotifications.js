import { useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationRead, subscribeToNotifications, getUnreadNotificationCount } from '../lib/supabase';
import { useSession } from './useSession';

export function useNotifications() {
  const session = useSession();
  const userId = session?.user?.id;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const [data, count] = await Promise.all([
      getNotifications(userId),
      getUnreadNotificationCount(userId),
    ]);
    setNotifications(data);
    setUnreadCount(count);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    return subscribeToNotifications(userId, newNotif => {
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(c => c + 1);
    });
  }, [userId]);

  const markRead = useCallback(async (id) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read_at);
    await Promise.all(unread.map(n => markNotificationRead(n.id)));
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  }, [notifications]);

  return { notifications, unreadCount, loading, refresh, markRead, markAllRead };
}
