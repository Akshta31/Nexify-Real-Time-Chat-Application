import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nexify_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('nexify_token');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (userId, password) => {
    const res = await api.post('/auth/login', { userId, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('nexify_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    return userData;
  };

  const register = async (userId, username, password) => {
    const res = await api.post('/auth/register', { userId, username, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('nexify_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    localStorage.removeItem('nexify_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
