import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Auth check failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      setUser(res.data);
      return { success: true };
    } catch (err) {
      console.error('Login failed:', err);
      return { success: false, error: err.response?.data?.msg || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
      return { success: true };
    } catch (err) {
      console.error('Logout failed:', err);
      return { success: false, error: err.response?.data?.msg || 'Logout failed' };
    }
  };

  const register = async (username, password) => {
    try {
      const res = await axios.post('/api/auth/register', { username, password });
      setUser(res.data);
      return { success: true };
    } catch (err) {
      console.error('Registration failed:', err);
      return { success: false, error: err.response?.data?.msg || 'Registration failed' };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 