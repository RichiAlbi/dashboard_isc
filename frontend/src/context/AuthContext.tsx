/**
 * Authentication Context
 * Provides global auth state management for the application
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '../types/user';
import {
  verifyCredentials,
  logout as authLogout,
  saveAuthUser,
  getStoredAuthUser,
  clearStoredAuthUser,
  type AuthResult,
} from '../services/authService';

interface AuthContextType {
  /** Currently authenticated user, or null if not logged in */
  user: User | null;
  /** Whether authentication is in progress */
  isLoading: boolean;
  /** Last authentication error message */
  error: string | null;
  /** Login with username and password */
  login: (user: User, password: string) => Promise<boolean>;
  /** Logout current user */
  logout: () => Promise<void>;
  /** Check if user is authenticated */
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const storedUser = getStoredAuthUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = useCallback(async (selectedUser: User, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result: AuthResult = await verifyCredentials(selectedUser.username, password);

      if (result.success) {
        setUser(selectedUser);
        saveAuthUser(selectedUser);
        return true;
      } else {
        setError(result.error || 'Anmeldung fehlgeschlagen');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authLogout();
    } finally {
      setUser(null);
      clearStoredAuthUser();
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: user !== null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
