import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { CircularProgress, Box } from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface User {
  _id: string;
  username: string;
  email: string;
  coins: number;
  stats: {
    wins: number;
    losses: number;
    draws: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { username: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// Create context with initial shape
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
});

// Custom hook for using auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth Provider component
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser) as AuthResponse;
          setUser(userData.user);
          axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
          
          // Verify token is still valid
          try {
            await axios.get(`${API_URL}/api/auth/me`);
          } catch (err) {
            // Token is invalid, clear auth state
            handleLogout();
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Handle API errors
  const handleApiError = useCallback((error: any) => {
    console.error('API Error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    setError(errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }, []);

  // Handle successful auth
  const handleAuthSuccess = useCallback((response: { data: AuthResponse }) => {
    const { token, user: userData } = response.data;
    const authData = { token, user: userData };
    
    localStorage.setItem('user', JSON.stringify(authData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    setError(null);
    
    return { success: true };
  }, []);

  // Login handler
  const handleLogin = useCallback(async (username: string, password: string) => {
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/api/auth/login`, {
        username,
        password
      });
      return handleAuthSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleAuthSuccess, handleApiError]);

  // Register handler
  const handleRegister = useCallback(async (userData: { username: string; email: string; password: string }) => {
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/api/auth/register`, userData);
      return handleAuthSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleAuthSuccess, handleApiError]);

  // Logout handler
  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setError(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  }), [user, loading, error, handleLogin, handleRegister, handleLogout]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 