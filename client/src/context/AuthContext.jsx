import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [tokens, setTokens] = useState(() => {
    const raw = localStorage.getItem('auth_tokens');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (tokens?.access) setAuthToken(tokens.access);
    else setAuthToken(null);
  }, [tokens]);

  useEffect(() => {
    if (user) localStorage.setItem('auth_user', JSON.stringify(user));
    else localStorage.removeItem('auth_user');
  }, [user]);

  useEffect(() => {
    if (tokens) localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    else localStorage.removeItem('auth_tokens');
  }, [tokens]);

  const value = useMemo(() => ({ user, tokens, setUser, setTokens, logout: () => { setUser(null); setTokens(null); } }), [user, tokens]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
