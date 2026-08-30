import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { guardianApi } from '../api/guardianApi';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, isLoading: false, user: action.payload, isAuthenticated: true, error: null };
    case 'AUTH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'AUTH_LOGOUT':
      return { ...initialState, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'UPDATE_AVATAR':
      return { ...state, user: state.user ? { ...state.user, avatarUrl: action.payload } : null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('campusx_access_token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const { data } = await guardianApi.getProfile();
        dispatch({ type: 'AUTH_SUCCESS', payload: data.data.user });
      } catch {
        localStorage.removeItem('campusx_access_token');
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { data } = await guardianApi.login(credentials);
      localStorage.setItem('campusx_access_token', data.data.accessToken);
      dispatch({ type: 'AUTH_SUCCESS', payload: data.data.user });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { data } = await guardianApi.register(userData);
      dispatch({ type: 'SET_LOADING', payload: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await guardianApi.logout();
    } catch {
      // Proceed with logout even if API fails
    }
    localStorage.removeItem('campusx_access_token');
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await guardianApi.logoutAll();
    } catch {
      // Proceed anyway
    }
    localStorage.removeItem('campusx_access_token');
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await guardianApi.getProfile();
      dispatch({ type: 'AUTH_SUCCESS', payload: data.data.user });
    } catch {
      // Silently fail
    }
  }, []);

  const updateAvatar = useCallback((avatarUrl) => {
    dispatch({ type: 'UPDATE_AVATAR', payload: avatarUrl });
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    logoutAll,
    clearError,
    refreshProfile,
    updateAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
