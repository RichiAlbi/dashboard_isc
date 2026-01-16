import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '../config/api'
import type { Widget, WidgetCreate, WidgetUpdate, UserWidget, UserWidgetUpdate, UserWidgetBulkUpdate } from '../types/widget'
import { indexToPosition } from '../utils/gridLayoutUtils'

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
  hiddenWidgets: (userId: string) => [...widgetKeys.all, 'user', userId, 'hidden'] as const,
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
 * Fetch hidden user widgets (can be re-added)
 */
export async function fetchHiddenUserWidgets(userId: string): Promise<UserWidget[]> {
  return apiFetch<UserWidget[]>(`/widgets/${userId}/hidden`)
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
 * React Query hook to fetch hidden user widgets
 * These are widgets that can be re-added to the dashboard
 */
export function useHiddenUserWidgets(userId: string | undefined) {
  return useQuery<UserWidget[], ApiError>({
    queryKey: widgetKeys.hiddenWidgets(userId || ''),
    queryFn: () => fetchHiddenUserWidgets(userId!),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
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

/**
 * Bulk update user widgets (positions, visibility)
 * Backend endpoint: PUT /widgets/{user_id}
 */
export async function bulkUpdateUserWidgets(userId: string, updates: UserWidgetUpdate[]): Promise<UserWidget[]> {
  const payload: UserWidgetBulkUpdate = { widgets: updates }
  return apiFetch<UserWidget[]>(`/widgets/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * Remove a widget from user's view (sets visible=false)
 * This doesn't delete the row, just hides it
 */
export async function removeUserWidget(userId: string, widgetId: string): Promise<UserWidget> {
  return bulkUpdateUserWidgets(userId, [{
    widgetId,
    visible: false,
  }]).then(results => results[0])
}

/**
 * Add a widget back to user's view (sets visible=true)
 * Used when re-adding a hidden widget
 */
export async function addUserWidget(userId: string, widgetId: string, position: { x: number; y: number }): Promise<UserWidget> {
  return bulkUpdateUserWidgets(userId, [{
    widgetId,
    visible: true,
    config: position,
  }]).then(results => results[0])
}

/**
 * React Query mutation hook to bulk update user widget positions and visibility
 * Use this to save layout changes after user drags widgets or toggles visibility
 */
export function useBulkUpdateUserWidgets() {
  const queryClient = useQueryClient()

  return useMutation<UserWidget[], ApiError, { userId: string; updates: UserWidgetUpdate[] }>({
    mutationFn: ({ userId, updates }) => bulkUpdateUserWidgets(userId, updates),
    onSuccess: (_, variables) => {
      // Invalidate user widgets to refetch with updated positions
      queryClient.invalidateQueries({ queryKey: widgetKeys.userWidgets(variables.userId) })
      queryClient.invalidateQueries({ queryKey: widgetKeys.hiddenWidgets(variables.userId) })
    },
  })
}

/**
 * React Query mutation hook to remove a widget from user's view
 * Sets visible=false without deleting the database row
 */
export function useRemoveUserWidget() {
  const queryClient = useQueryClient()

  return useMutation<UserWidget, ApiError, { userId: string; widgetId: string }>({
    mutationFn: ({ userId, widgetId }) => removeUserWidget(userId, widgetId),
    onSuccess: (_, variables) => {
      // Invalidate user widgets to refetch without the removed widget
      queryClient.invalidateQueries({ queryKey: widgetKeys.userWidgets(variables.userId) })
      queryClient.invalidateQueries({ queryKey: widgetKeys.hiddenWidgets(variables.userId) })
    },
  })
}

/**
 * React Query mutation hook to add a hidden widget back to user's view
 * Sets visible=true with the specified position
 */
export function useAddUserWidget() {
  const queryClient = useQueryClient()

  return useMutation<UserWidget, ApiError, { userId: string; widgetId: string; position: { x: number; y: number } }>({
    mutationFn: ({ userId, widgetId, position }) => addUserWidget(userId, widgetId, position),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: widgetKeys.userWidgets(variables.userId) })
      queryClient.invalidateQueries({ queryKey: widgetKeys.hiddenWidgets(variables.userId) })
    },
  })
}

/**
 * Reset user widgets to default layout
 * - Makes all default widgets visible
 * - Resets positions to default order
 * - Hides any widgets that are not in the default set
 */
export async function resetUserWidgetsToDefault(
  userId: string,
  defaultWidgets: Widget[],
  allUserWidgets: UserWidget[],
  cols: number = 3
): Promise<UserWidget[]> {
  const defaultWidgetIds = new Set(defaultWidgets.map(w => w.widgetId))

  // Create updates: show default widgets with reset positions, hide non-defaults
  const updates: UserWidgetUpdate[] = allUserWidgets.map(userWidget => {
    const isDefault = defaultWidgetIds.has(userWidget.widgetId)

    if (isDefault) {
      // Find index in default widgets order
      const defaultIndex = defaultWidgets.findIndex(dw => dw.widgetId === userWidget.widgetId)
      return {
        widgetId: userWidget.widgetId,
        visible: true,
        config: indexToPosition(defaultIndex, cols),
      }
    } else {
      // Non-default widget: hide it
      return {
        widgetId: userWidget.widgetId,
        visible: false,
      }
    }
  })

  return bulkUpdateUserWidgets(userId, updates)
}

/**
 * React Query mutation hook to reset user widgets to default layout
 */
export function useResetUserWidgets() {
  const queryClient = useQueryClient()

  return useMutation<
    UserWidget[],
    ApiError,
    { userId: string; defaultWidgets: Widget[]; allUserWidgets: UserWidget[]; cols?: number }
  >({
    mutationFn: ({ userId, defaultWidgets, allUserWidgets, cols }) =>
      resetUserWidgetsToDefault(userId, defaultWidgets, allUserWidgets, cols),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: widgetKeys.userWidgets(variables.userId) })
      queryClient.invalidateQueries({ queryKey: widgetKeys.hiddenWidgets(variables.userId) })
    },
  })
}
