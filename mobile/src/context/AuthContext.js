import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('tickthetask_token');
      await SecureStore.deleteItemAsync('tickthetask_user');
    } catch (e) {
      // ignore
    }
    setToken(null);
    setUser(null);
  }, []);

  // Validate existing token on mount
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await SecureStore.getItemAsync('tickthetask_token');
        const storedUser = await SecureStore.getItemAsync('tickthetask_user');

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }

          // Verify with backend
          try {
            const freshUser = await authService.getCurrentUser();
            setUser(freshUser);
            await SecureStore.setItemAsync('tickthetask_user', JSON.stringify(freshUser));
          } catch (err) {
            console.warn('Token validation on startup failed:', err.message);
            await logout();
          }
        }
      } catch (e) {
        console.warn('Error checking stored auth:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredAuth();

    const subscription = require('react-native').DeviceEventEmitter.addListener('auth:unauthorized', () => {
      logout();
    });

    return () => subscription.remove();
  }, [logout]);

  const login = async (email, password) => {
    try {
      const { access_token } = await authService.login({ email, password });
      await SecureStore.setItemAsync('tickthetask_token', access_token);
      setToken(access_token);

      const userData = await authService.getCurrentUser();
      await SecureStore.setItemAsync('tickthetask_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend server. Check your network or server URL.'
          : 'Authentication failed. Please check your credentials.');
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    try {
      await authService.register({ name, email, password });
      return await login(email, password);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend server. Check your network or server URL.'
          : 'Registration failed. Please check your details and try again.');
      return { success: false, error: errorMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
