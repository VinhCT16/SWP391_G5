import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchMe() {
      try {
        setLoading(true);
        const res = await api.get('/api/auth/me');
        if (isMounted) setUser(res.data.user);
      } catch (_) {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchMe();
    return () => {
      isMounted = false;
    };
  }, []);

  async function login(email, password) {
    setError(null);
    const res = await api.post('/api/auth/login', { email, password });
    setUser(res.data.user);
  }

  async function register(name, email, password, phone = null, role = "customer") {
    setError(null);
    await api.post('/api/auth/register', { name, email, password, phone, role });
  }

  async function logout() {
    try {
      // Call logout API to clear server-side session
      await api.post('/api/auth/logout');
    } catch (err) {
      // Even if API call fails, we should still clear local state
      console.warn('Logout API call failed:', err);
    } finally {
      // Clear all local authentication state
      setUser(null);
      setError(null);
      setLoading(false);
      
      // Clear any stored tokens or data in localStorage/sessionStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.clear();
      
      // Clear any cookies by making a request to logout endpoint
      // This ensures HttpOnly cookies are cleared
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (err) {
        console.warn('Failed to clear cookies:', err);
      }
    }
  }

  const value = useMemo(() => ({ user, loading, error, login, register, logout }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


