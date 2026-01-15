/**
 * User API service using React Query
 * Provides hooks for fetching, creating, updating, and deleting users
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../config/api';
import type { User, UserCreate, UserUpdate, UserSearchParams } from '../types/user';

// Query keys for React Query cache management
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: UserSearchParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

/**
 * Fetch all users with optional search/filtering
 */
export async function fetchUsers(params?: UserSearchParams): Promise<User[]> {
  const queryParams = new URLSearchParams();

  if (params?.q) queryParams.append('q', params.q);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = `/users/${queryString ? `?${queryString}` : ''}`;

  return apiFetch<User[]>(endpoint);
}

/**
 * Fetch a single user by ID
 */
export async function fetchUser(userId: string): Promise<User> {
  return apiFetch<User>(`/users/${userId}`);
}

/**
 * Create a new user
 */
export async function createUser(user: UserCreate): Promise<User> {
  return apiFetch<User>('/users/', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

/**
 * Update an existing user
 */
export async function updateUser(userId: string, user: UserUpdate): Promise<User> {
  return apiFetch<User>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string): Promise<void> {
  return apiFetch<void>(`/users/${userId}`, {
    method: 'DELETE',
  });
}

/**
 * Trigger LDAP sync
 */
export async function syncLdap(): Promise<{ synced: number; message: string }> {
  return apiFetch<{ synced: number; message: string }>('/users/sync-ldap', {
    method: 'POST',
  });
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch all users with optional search
 */
export function useUsers(params?: UserSearchParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch users with infinite scrolling/pagination
 * Uses cursor-based pagination with offset
 */
export function useInfiniteUsers(searchQuery?: string) {
  const pageSize = 20; // Items per page

  return useInfiniteQuery({
    queryKey: ['users', 'infinite', searchQuery],
    queryFn: ({ pageParam = 0 }) =>
      fetchUsers({
        q: searchQuery,
        limit: pageSize,
        offset: pageParam
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than pageSize, we've reached the end
      if (lastPage.length < pageSize) {
        return undefined;
      }
      // Calculate the next offset
      return allPages.length * pageSize;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UserCreate>({
    mutationFn: createUser,
    onSuccess: () => {
      // Invalidate and refetch user list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Hook to update an existing user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, { userId: string; data: UserUpdate }>({
    mutationFn: ({ userId, data }) => updateUser(userId, data),
    onSuccess: (data, variables) => {
      // Invalidate the specific user and the list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteUser,
    onSuccess: (_, userId) => {
      // Remove the user from cache and invalidate list
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Hook to sync users from LDAP
 */
export function useSyncLdap() {
  const queryClient = useQueryClient();

  return useMutation<{ synced: number; message: string }, Error>({
    mutationFn: syncLdap,
    onSuccess: () => {
      // Invalidate all user queries to refetch with new LDAP data
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
