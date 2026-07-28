import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiMe, apiRefresh, apiLogout, setAccessToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children, onAuthStateChange }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking session on mount

  // Try to restore session silently (using httpOnly refresh token cookie)
  const restoreSession = useCallback(async () => {
    try {
      const refreshRes = await apiRefresh();
      setAccessToken(refreshRes.data.accessToken);
      const meRes = await apiMe();
      setUser(meRes.data);
      onAuthStateChange?.('app');
    } catch {
      setUser(null);
      onAuthStateChange?.('login');
    } finally {
      setLoading(false);
    }
  }, [onAuthStateChange]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = (userData, accessToken) => {
    setAccessToken(accessToken);
    setUser(userData);
  };

  const logout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
