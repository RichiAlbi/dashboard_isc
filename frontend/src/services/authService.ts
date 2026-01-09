/**
 * Authentication Service
 * Handles login/logout via Backend LDAP verification with XOR password encryption
 */

import type { User } from '../types/user';
import { encryptPassword, isEncryptionEnabled } from '../utils/encryption';
import { getApiBaseUrl } from '../config/api';

export interface VerifyResponse {
  success: boolean;
  message: string;
  user?: {
    userId: string | null;
    username: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
  };
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

/**
 * Verify user credentials against LDAP via backend
 * Password is encrypted with XOR if VITE_ENCRYPTION_KEY is set
 */
export async function verifyCredentials(
  username: string,
  password: string
): Promise<AuthResult> {
  try {
    // Passwort verschlüsseln falls aktiviert
    const encryptedPassword = encryptPassword(password);
    
    if (isEncryptionEnabled()) {
      console.debug('Passwort wurde für Übertragung verschlüsselt');
    }

    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password: encryptedPassword,
      }),
    });

    const data: VerifyResponse = await response.json();

    if (data.success && data.user) {
      // Map backend user to frontend User type
      const user: User = {
        userId: data.user.userId || '',
        username: data.user.username,
        email: data.user.email || '',
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        isActive: data.user.isActive,
        theme: 'system',
        fromLdap: true,
        lastLdapSync: null,
      };

      return { success: true, user };
    }

    return {
      success: false,
      error: data.message || 'Ungültige Anmeldedaten',
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      success: false,
      error: 'Netzwerkfehler bei der Authentifizierung',
    };
  }
}

/**
 * Logout - clears local storage (no backend session to clear)
 */
export async function logout(): Promise<void> {
  clearStoredAuthUser();
}

/**
 * Storage key for persisted auth state
 */
const AUTH_STORAGE_KEY = 'dashboard_auth_user';

/**
 * Save authenticated user to localStorage
 */
export function saveAuthUser(user: User): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

/**
 * Get authenticated user from localStorage
 */
export function getStoredAuthUser(): User | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as User;
    }
  } catch (error) {
    console.error('Error reading stored auth user:', error);
  }
  return null;
}

/**
 * Clear authenticated user from localStorage
 */
export function clearStoredAuthUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
