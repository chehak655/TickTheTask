import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tickthetask_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('tickthetask_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('tickthetask_token');
    localStorage.removeItem('tickthetask_user');
    setToken(null);
    setUser(null);
  }, []);

  // Validate existing token on mount
  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('tickthetask_token');
      if (storedToken) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          localStorage.setItem('tickthetask_user', JSON.stringify(userData));
        } catch (err) {
          console.warn('Session verification failed on startup:', err.message);
          logout();
        }
      }
      setIsLoading(false);
    }
    checkAuth();

    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  const login = async (email, password) => {
    try {
      const { access_token } = await authService.login({ email, password });
      localStorage.setItem('tickthetask_token', access_token);
      setToken(access_token);

      const userData = await authService.getCurrentUser();
      localStorage.setItem('tickthetask_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        (err.code === 'ERR_NETWORK' ? 'Cannot connect to backend server. Please ensure the backend is running.' : 'Authentication failed. Please check your credentials.');
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    try {
      await authService.register({ name, email, password });
      // Automatically log in after registration
      return await login(email, password);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        (err.code === 'ERR_NETWORK' ? 'Cannot connect to backend server. Please ensure the backend is running.' : 'Registration failed. Please check your details and try again.');
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
