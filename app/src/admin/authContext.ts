import { createContext } from 'react';

export interface AuthContextValue {
  isAuthenticated: boolean;
  username: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
