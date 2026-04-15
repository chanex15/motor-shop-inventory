'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Notification {
  id: string;
  type: 'low_stock' | 'new_sale';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const channelsRef = useRef<{ sales: any; inventory: any } | null>(null);
  const isSubscribed = useRef(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const notifs: Notification[] = [];
      const dismissed = getDismissedNotifications();

      // Fetch low stock items
      const { data: lowStockItems } = await supabase
        .from('inventory')
        .select('*')
        .lt('stock_quantity', 'low_stock_threshold')
        .order('stock_quantity', { ascending: true });

      if (lowStockItems && lowStockItems.length > 0) {
        lowStockItems.forEach((item) => {
          const id = `low_stock_${item.id}`;
          if (!dismissed.includes(id)) {
            notifs.push({
              id,
              type: 'low_stock',
              title: 'Low Stock Alert',
              message: `${item.name} is running low (${item.stock_quantity} units left, threshold: ${item.low_stock_threshold})`,
              timestamp: new Date().toISOString(),
              read: false,
              data: item,
            });
          }
        });
      }

      // Fetch recent sales (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: recentSales } = await supabase
        .from('sales')
        .select(`
          *,
          profiles!sales_cashier_id_fkey (full_name)
        `)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentSales && recentSales.length > 0) {
        recentSales.forEach((sale) => {
          const id = `sale_${sale.id}`;
          if (!dismissed.includes(id)) {
            notifs.push({
              id,
              type: 'new_sale',
              title: 'New Sale',
              message: `Sale #${sale.id.slice(0, 8)} - ₱${Number(sale.total).toFixed(2)} by ${sale.profiles?.full_name || 'Unknown'}`,
              timestamp: sale.created_at,
              read: false,
              data: sale,
            });
          }
        });
      }

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback((id: string) => {
    dismissNotification(id);
    setNotifications((prev) => {
      const notif = prev.find((n) => n.id === id);
      if (notif && !notif.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  // Setup realtime subscriptions once
  useEffect(() => {
    if (isSubscribed.current) return;
    isSubscribed.current = true;

    fetchNotifications();

    const salesChannel = supabase
      .channel(`sales-notifications-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales' },
        async (payload) => {
          const newSale = payload.new;
          const notifId = `sale_${newSale.id}`;
          
          // Check if dismissed
          const dismissed = getDismissedNotifications();
          if (dismissed.includes(notifId)) return;

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newSale.cashier_id)
            .single();

          const newNotif: Notification = {
            id: notifId,
            type: 'new_sale',
            title: 'New Sale',
            message: `Sale #${newSale.id.slice(0, 8)} - ${Number(newSale.total).toFixed(2)} by ${profile?.full_name || 'Unknown'}`,
            timestamp: newSale.created_at,
            read: false,
            data: newSale,
          };

          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    const inventoryChannel = supabase
      .channel(`inventory-notifications-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inventory' },
        async (payload) => {
          const updatedItem = payload.new;
          const notifId = `low_stock_${updatedItem.id}`;

          if (
            Number(updatedItem.stock_quantity) <= Number(updatedItem.low_stock_threshold)
          ) {
            // Check if dismissed
            const dismissed = getDismissedNotifications();
            if (dismissed.includes(notifId)) return;

            setNotifications((prev) => {
              const exists = prev.some((n) => n.id === notifId);
              if (!exists) {
                setUnreadCount((count) => count + 1);
                return [
                  {
                    id: notifId,
                    type: 'low_stock',
                    title: 'Low Stock Alert',
                    message: `${updatedItem.name} is running low (${updatedItem.stock_quantity} units left)`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    data: updatedItem,
                  },
                  ...prev,
                ];
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    channelsRef.current = { sales: salesChannel, inventory: inventoryChannel };

    return () => {
      isSubscribed.current = false;
      if (channelsRef.current) {
        supabase.removeChannel(channelsRef.current.sales);
        supabase.removeChannel(channelsRef.current.inventory);
        channelsRef.current = null;
      }
    };
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}

// Helper functions for localStorage persistence
const DISMISSED_KEY = 'dismissed_notifications';

export function getDismissedNotifications(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function dismissNotification(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const dismissed = getDismissedNotifications();
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    }
  } catch (err) {
    console.error('Failed to save dismissed notification:', err);
  }
}

export function restoreNotification(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const dismissed = getDismissedNotifications().filter((n) => n !== id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  } catch (err) {
    console.error('Failed to restore notification:', err);
  }
}
