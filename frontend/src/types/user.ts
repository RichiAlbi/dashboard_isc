/**
 * User type definitions matching the backend API schemas
 * Based on backend/src/schemas/user.py
 */

export interface User {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  theme: 'light' | 'dark' | 'system';
  fromLdap: boolean;
  lastLdapSync: string | null;
}

export interface UserCreate {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

export interface UserUpdate {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

export interface UserSearchParams {
  q?: string;
  limit?: number;
  offset?: number;
}

/**
 * Helper to get full name from user
 */
export function getUserFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

/**
 * Helper to get display name (username if no first/last name)
 */
export function getUserDisplayName(user: User): string {
  const fullName = getUserFullName(user);
  return fullName || user.username;
}
