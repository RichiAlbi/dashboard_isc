/**
 * Authentication Service
 * Handles login/logout via the nginx LDAP auth proxy
 */

import type { User } from '../types/user';

const AUTH_ENDPOINTS = {
  verify: '/api/auth/verify',
  logout: '/api/auth/logout',
};

export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Verify user credentials against LDAP via nginx proxy
 */
export async function verifyCredentials(
  username: string,
  password: string
): Promise<AuthResult> {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(AUTH_ENDPOINTS.verify, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      credentials: 'include', // Important for session cookie!
    });

    if (response.ok) {
      return { success: true };
    }

    if (response.status === 401) {
      return {
        success: false,
        error: 'Ungültige Anmeldedaten',
      };
    }

    return {
      success: false,
      error: `Authentifizierung fehlgeschlagen (${response.status})`,
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
 * Logout - clears the session cookie
 */
export async function logout(): Promise<void> {
  try {
    await fetch(AUTH_ENDPOINTS.logout, {
      method: 'GET',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
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
