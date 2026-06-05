import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { registerLogoutHandler } from '../api/apiClient.js';
import { connectSocket, disconnectSocket } from '../api/socketClient.js';

export const useUserStore = create((set, get) => {
  // Register standard logout handler in the API layer
  registerLogoutHandler(() => {
    get().logout();
  });

  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    onlineUsers: new Set(), // Map of active users online

    initialize: async () => {
      set({ loading: true });
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const userDataStr = await AsyncStorage.getItem('user');

        if (accessToken && userDataStr) {
          const user = JSON.parse(userDataStr);
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            loading: false,
          });

          // Connect Socket.IO automatically
          get().setupSocket(accessToken);
        } else {
          set({ loading: false, isAuthenticated: false });
        }
      } catch (err) {
        set({ error: err.message, loading: false });
      }
    },

    login: async (email, password) => {
      set({ loading: true, error: null });
      try {
        const response = await apiClient.post('/auth/login', { email, password });
        const { accessToken, refreshToken, user } = response.data.data;

        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          loading: false,
        });

        // Initialize Sockets
        get().setupSocket(accessToken);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Login failed';
        set({ error: msg, loading: false });
        throw new Error(msg);
      }
    },

    logout: async () => {
      try {
        // Attempt clean logout on server (deletes device sessions)
        await apiClient.post('/auth/logout').catch(() => {});
      } catch (e) {}

      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');

      disconnectSocket();

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        onlineUsers: new Set(),
      });
    },

    setupSocket: (token) => {
      // Connect and bind presence updates
      connectSocket(token, {
        'presence-update': (data) => {
          set((state) => {
            const nextOnline = new Set(state.onlineUsers);
            if (data.status === 'online') {
              nextOnline.add(data.userId);
            } else {
              nextOnline.delete(data.userId);
            }
            return { onlineUsers: nextOnline };
          });
        },
      });
    },
  };
});
