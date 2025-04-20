import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create and export the context with initial shape
export const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Handle API errors
  const handleApiError = useCallback((error) => {
    console.error('API Error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    setError(errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }, []);

  // Handle successful auth
  const handleAuthSuccess = useCallback((response) => {
    const { token, user: userData } = response.data;
    const authData = { token, user: userData };
    
    localStorage.setItem('user', JSON.stringify(authData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    setError(null);
    
    return { success: true };
  }, []);

  // Login handler
  const handleLogin = useCallback(async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password
      });
      return handleAuthSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  }, [handleAuthSuccess, handleApiError]);

  // Register handler
  const handleRegister = useCallback(async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);
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
    return null; // Or a loading spinner component
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// PropTypes for type checking
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Default props
AuthProvider.defaultProps = {
  children: null,
}; 