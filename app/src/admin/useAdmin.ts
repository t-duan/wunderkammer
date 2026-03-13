import { useContext } from 'react';
import { AdminContext } from './adminContext';
import type { AdminContextValue } from './adminContext';

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
