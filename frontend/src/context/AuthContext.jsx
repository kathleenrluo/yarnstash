/**
 * Auth context: Google OAuth token and user state.
 * - Token stored in localStorage so it survives refresh.
 * - Login = open popup to backend /auth/google; callback loads in popup, sends token to opener, closes.
 * - Logout = clear token and user.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AUTH_TOKEN_KEY = 'auth_token';
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:8000';

const POPUP_NAME = 'google-auth';
const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 620;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      setTokenState(newToken);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setTokenState(null);
      setUser(null);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    const t = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setUser(data);
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [setToken]);

  useEffect(() => {
    // Handle OAuth callback: in popup we send token to opener and close; in main window we read token from URL.
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const authError = params.get('auth_error');

    if (tokenFromUrl && window.opener) {
      // We're in the popup: send token to opener and close.
      window.opener.postMessage(
        { type: 'AUTH_TOKEN', token: tokenFromUrl },
        window.location.origin
      );
      window.close();
      return;
    }

    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (authError) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    fetchUser();
  }, [setToken, fetchUser]);

  // Opener: listen for token from popup
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'AUTH_TOKEN' && e.data?.token) {
        setToken(e.data.token);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setToken]);

  // When token changes (e.g. after URL parse), refetch user
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(() => {
    const left = Math.round((window.screen.width - POPUP_WIDTH) / 2);
    const top = Math.round((window.screen.height - POPUP_HEIGHT) / 2);
    const spec = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},scrollbars=yes,resizable=yes`;
    window.open(`${API_BASE_URL}/auth/google`, POPUP_NAME, spec);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  const value = {
    token,
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}
