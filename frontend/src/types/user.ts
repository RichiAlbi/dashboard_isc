/**
 * User type definitions matching the backend API schemas
 * Based on backend/src/schemas/user.py
 */

/**
 * Zoom levels: 1=Klein (80%), 2=Normal (100%), 3=Groß (125%)
 */
export type ZoomLevel = 1 | 2 | 3

/**
 * User settings stored as JSON in the database
 * Can be expanded with additional settings without schema changes
 */
export interface UserSettings {
  zoom?: ZoomLevel;
  /** Whether the background gradient adopts the hovered widget's color (default: true) */
  widgetColorOnBackground?: boolean;
}

export interface User {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  settings: UserSettings | null;
  fromLdap: boolean;
  lastLdapSync: string | null;
  isAdmin: boolean;
}

export interface UserCreate {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  settings?: UserSettings;
}

export interface UserUpdate {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  settings?: UserSettings;
  isAdmin?: boolean;
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
  return `${user.lastName}, ${user.firstName}`.trim();
}

/**
 * Helper to get display name (username if no first/last name)
 */
export function getUserDisplayName(user: User): string {
  const fullName = getUserFullName(user);
  return fullName || user.username;
}
