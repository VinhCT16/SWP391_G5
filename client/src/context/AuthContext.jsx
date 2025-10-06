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

  async function register(name, email, password) {
    setError(null);
    await api.post('/api/auth/register', { name, email, password });
  }

  async function logout() {
    await api.post('/api/auth/logout');
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, error, login, register, logout }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


