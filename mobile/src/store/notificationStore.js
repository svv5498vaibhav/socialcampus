import { create } from 'zustand';
import apiClient from '../api/apiClient.js';
import { connectSocket } from '../api/socketClient.js';

export const useNotificationStore = create((set, get) => {
  return {
    notifications: [],
    unreadCount: 0,
    loading: false,
    page: 1,
    hasMore: true,

    fetchNotifications: async (isRefresh = false) => {
      const currentPage = isRefresh ? 1 : get().page;
      set({ loading: true });

      try {
        const response = await apiClient.get('/feed/notifications', {
          params: { page: currentPage, limit: 15 },
        });
        const fetchedList = response.data.data;

        set((state) => {
          const nextList = isRefresh ? fetchedList : [...state.notifications, ...fetchedList];
          return {
            notifications: nextList,
            page: currentPage + 1,
            hasMore: fetchedList.length === 15,
            loading: false,
          };
        });
      } catch (err) {
        console.error('Failed to load notifications:', err.message);
        set({ loading: false });
      }
    },

    fetchUnreadCount: async () => {
      try {
        const response = await apiClient.get('/feed/notifications/unread-count');
        set({ unreadCount: response.data.data.count });
      } catch (err) {
        console.error('Failed to fetch unread count:', err.message);
      }
    },

    markNotificationsAsRead: async (notificationId = null) => {
      try {
        await apiClient.post('/feed/notifications/read', { notificationId });
        
        set((state) => {
          if (notificationId) {
            // Mark single read
            const updated = state.notifications.map((n) =>
              n._id === notificationId ? { ...n, isRead: true } : n
            );
            const newCount = Math.max(state.unreadCount - 1, 0);
            return { notifications: updated, unreadCount: newCount };
          } else {
            // Mark all read
            const updated = state.notifications.map((n) => ({ ...n, isRead: true }));
            return { notifications: updated, unreadCount: 0 };
          }
        });
      } catch (err) {
        console.error('Failed to mark notifications read:', err.message);
      }
    },

    setupNotificationSocket: (accessToken) => {
      // Connect to notifications channel
      connectSocket(accessToken, {
        'notification': (notif) => {
          // Prepend to list
          set((state) => ({
            notifications: [notif, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }));
        },
      });
    },
  };
});
