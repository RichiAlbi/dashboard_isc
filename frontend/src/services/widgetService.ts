import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '../config/api'
import type { Widget, WidgetCreate, WidgetUpdate, UserWidget } from '../types/widget'

/**
 * Query keys for React Query cache management
 */
export const widgetKeys = {
  all: ['widgets'] as const,
  lists: () => [...widgetKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...widgetKeys.lists(), filters] as const,
  details: () => [...widgetKeys.all, 'detail'] as const,
  detail: (id: string) => [...widgetKeys.details(), id] as const,
  userWidgets: (userId: string) => [...widgetKeys.all, 'user', userId] as const,
}

/**
 * API request parameters for listing widgets
 */
interface WidgetListParams extends Record<string, unknown> {
  limit?: number
  offset?: number
  default?: boolean
}

/**
 * Fetch all widgets from the API
 */
export async function fetchWidgets(params?: WidgetListParams): Promise<Widget[]> {
  const queryParams = new URLSearchParams()
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.offset) queryParams.append('offset', params.offset.toString())
  if (params?.default !== undefined) queryParams.append('default', params.default.toString())

  const queryString = queryParams.toString()
  const url = `/widgets/${queryString ? `?${queryString}` : ''}`

  return apiFetch<Widget[]>(url)
}

/**
 * Fetch only default widgets using backend filtering
 */
export async function fetchDefaultWidgets(): Promise<Widget[]> {
  return fetchWidgets({ default: true, limit: 100 })
}

/**
 * Fetch user-specific widgets (with user config)
 */
export async function fetchUserWidgets(userId: string): Promise<UserWidget[]> {
  return apiFetch<UserWidget[]>(`/widgets/${userId}`)
}

/**
 * Create a new widget
 */
export async function createWidget(widget: WidgetCreate): Promise<Widget> {
  return apiFetch<Widget>('/widgets/', {
    method: 'POST',
    body: JSON.stringify(widget),
  })
}

/**
 * Bulk update widgets
 */
export async function bulkUpdateWidgets(updates: WidgetUpdate[]): Promise<Widget[]> {
  return apiFetch<Widget[]>('/widgets/', {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

/**
 * React Query hook to fetch all widgets
 */
export function useWidgets(params?: WidgetListParams) {
  return useQuery<Widget[], ApiError>({
    queryKey: widgetKeys.list(params),
    queryFn: () => fetchWidgets(params),
  })
}

/**
 * React Query hook to fetch only default widgets
 * Use this for the non-logged-in state
 */
export function useDefaultWidgets() {
  return useQuery<Widget[], ApiError>({
    queryKey: widgetKeys.list({ default: true }),
    queryFn: fetchDefaultWidgets,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (default widgets rarely change)
  })
}

/**
 * React Query hook to fetch user-specific widgets
 * Use this for logged-in users to get their personalized widget config
 */
export function useUserWidgets(userId: string | undefined) {
  return useQuery<UserWidget[], ApiError>({
    queryKey: widgetKeys.userWidgets(userId || ''),
    queryFn: () => fetchUserWidgets(userId!),
    enabled: !!userId, // Only fetch when userId is available
    staleTime: 1 * 60 * 1000, // Cache for 1 minute (user settings may change)
  })
}

/**
 * React Query mutation hook to create a new widget
 */
export function useCreateWidget() {
  const queryClient = useQueryClient()

  return useMutation<Widget, ApiError, WidgetCreate>({
    mutationFn: createWidget,
    onSuccess: () => {
      // Invalidate all widget lists to refetch with new data
      queryClient.invalidateQueries({ queryKey: widgetKeys.lists() })
    },
  })
}

/**
 * React Query mutation hook to bulk update widgets
 */
export function useBulkUpdateWidgets() {
  const queryClient = useQueryClient()

  return useMutation<Widget[], ApiError, WidgetUpdate[]>({
    mutationFn: bulkUpdateWidgets,
    onSuccess: () => {
      // Invalidate all widget lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: widgetKeys.lists() })
    },
  })
}
