import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get state updater from userStore (imported dynamically to avoid circular dependencies)
let logoutHandler = null;
export const registerLogoutHandler = (handler) => {
  logoutHandler = handler;
};

// Request Interceptor: Inject Access Token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Token Auto-Refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call standard CampusX Guardian AI refresh token route
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data;

        await AsyncStorage.setItem('accessToken', newAccess);
        if (newRefresh) {
          await AsyncStorage.setItem('refreshToken', newRefresh);
        }

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;

        processQueue(null, newAccess);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;

        // Invalidate session
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        
        if (logoutHandler) {
          logoutHandler();
        }
        
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
