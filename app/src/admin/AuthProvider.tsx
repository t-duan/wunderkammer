import { useState, useCallback, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './authContext';

const TOKEN_KEY = 'wunderkammer_admin_token';

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Check auth on module load to avoid setState-in-effect
let authCheckResult: { resolved: boolean; authenticated: boolean; username: string | null } = {
  resolved: !getStoredToken(),
  authenticated: false,
  username: null,
};
let authCheckListeners: Array<() => void> = [];

function notifyListeners() {
  authCheckListeners.forEach((l) => l());
}

if (getStoredToken()) {
  fetch('/api/auth/check', {
    headers: { Authorization: `Bearer ${getStoredToken()!}` },
  })
    .then((r) => r.json())
    .then((data: { authenticated: boolean; username: string | null }) => {
      if (!data.authenticated) localStorage.removeItem(TOKEN_KEY);
      authCheckResult = { resolved: true, authenticated: data.authenticated, username: data.username };
      notifyListeners();
    })
    .catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      authCheckResult = { resolved: true, authenticated: false, username: null };
      notifyListeners();
    });
}

function subscribeAuthCheck(listener: () => void) {
  authCheckListeners.push(listener);
  return () => {
    authCheckListeners = authCheckListeners.filter((l) => l !== listener);
  };
}

function getAuthCheckSnapshot() {
  return authCheckResult;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const initialCheck = useSyncExternalStore(subscribeAuthCheck, getAuthCheckSnapshot);
  const [authState, setAuthState] = useState<{ isAuthenticated: boolean; username: string | null } | null>(null);

  const isAuthenticated = authState !== null ? authState.isAuthenticated : initialCheck.authenticated;
  const username = authState !== null ? authState.username : initialCheck.username;
  const loading = !initialCheck.resolved;

  const login = useCallback(async (user: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        return data.error || 'Login failed';
      }
      const data = await res.json() as { token: string; username: string };
      localStorage.setItem(TOKEN_KEY, data.token);
      setAuthState({ isAuthenticated: true, username: data.username });
      return null;
    } catch {
      return 'Network error';
    }
  }, []);

  const logout = useCallback(async () => {
    const token = getStoredToken();
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    setAuthState({ isAuthenticated: false, username: null });
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<string | null> => {
    const token = getStoredToken();
    if (!token) return 'Not authenticated';
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        return data.error || 'Failed to change password';
      }
      return null;
    } catch {
      return 'Network error';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}
