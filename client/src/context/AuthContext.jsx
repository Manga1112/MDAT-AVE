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

  // Normalize role casing to a canonical value
  const normalizeUser = (u) => {
    if (!u || !u.role) return u;
    const roleMap = {
      admin: 'Admin',
      hr: 'HR',
      it: 'IT',
      manager: 'Manager',
      finance: 'Finance',
      candidate: 'Candidate',
      employee: 'Employee',
    };
    const key = String(u.role).trim().toLowerCase();
    const normRole = roleMap[key] || u.role;
    return normRole === u.role ? u : { ...u, role: normRole };
  };

  useEffect(() => {
    if (tokens?.access) setAuthToken(tokens.access);
    else setAuthToken(null);
  }, [tokens]);

  useEffect(() => {
    const nu = normalizeUser(user);
    if (nu && nu !== user) {
      // Update state with normalized role to keep everything consistent
      setUser(nu);
      return;
    }
    if (user) localStorage.setItem('auth_user', JSON.stringify(user));
    else localStorage.removeItem('auth_user');
  }, [user]);

  useEffect(() => {
    if (tokens) localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    else localStorage.removeItem('auth_tokens');
  }, [tokens]);

  const value = useMemo(() => ({
    user,
    tokens,
    setUser: (u) => setUser(normalizeUser(u)),
    setTokens,
    logout: () => { setUser(null); setTokens(null); },
  }), [user, tokens]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
