import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../services/authApi.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('veloop_auth_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore authenticated session on mount
  const restoreSession = useCallback(async () => {
    const storedToken = localStorage.getItem('veloop_auth_token');
    if (!storedToken) {
      setUser(null);
      setWallet(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await authApi.getMe();
      setUser(data.user);
      setWallet(data.wallet);
    } catch (err) {
      console.warn('[Auth] Session restore failed or token expired:', err.message);
      localStorage.removeItem('veloop_auth_token');
      setToken(null);
      setUser(null);
      setWallet(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Non-blocking fire-and-forget backend warmup request to wake sleeping Render instance
    authApi.warmupBackend();

    restoreSession();

    // Listen to global logout event triggered on 401 response
    const handleGlobalLogout = () => {
      setToken(null);
      setUser(null);
      setWallet(null);
    };

    window.addEventListener('veloop_auth_logout', handleGlobalLogout);
    return () => window.removeEventListener('veloop_auth_logout', handleGlobalLogout);
  }, [restoreSession]);

  // Register action
  const register = async (name, email, password) => {
    setError(null);
    try {
      const data = await authApi.register({ name, email, password });
      localStorage.setItem('veloop_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setWallet(data.wallet);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Login action
  const login = async (email, password) => {
    setError(null);
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem('veloop_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setWallet(data.wallet);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('veloop_auth_token');
    setToken(null);
    setUser(null);
    setWallet(null);
    setError(null);
  };

  // Refresh user profile & wallet from backend
  const refreshUser = async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setWallet(data.wallet);
      return data;
    } catch (err) {
      console.error('[Auth] Failed to refresh user profile:', err);
    }
  };

  // Directly update wallet in local state upon successful claim
  const updateWallet = (newWallet) => {
    if (newWallet) {
      setWallet((prev) => ({
        ...prev,
        ...newWallet
      }));
    }
  };

  const value = {
    user,
    wallet,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    error,
    register,
    login,
    logout,
    refreshUser,
    updateWallet
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
export default AuthContext;
