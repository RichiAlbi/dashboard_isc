import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import type { Layout } from 'react-grid-layout'
import type { UserWidget, UserWidgetUpdate } from '../types/widget'
import {
  indexToPosition,
  calculateMaxRows,
  calculateTargetIndex,
  reorderArray,
  sortWidgetsByPosition,
  orderToLayout,
  orderToPositionUpdates,
  syncOrderWithWidgets,
} from '../utils/gridLayoutUtils'
import { useDebouncedCallback } from './useDebouncedCallback'

interface GridLayoutConfig {
  cols: number
  rowHeight: number
}

interface UseGridLayoutManagerProps {
  widgets: UserWidget[]
  config: GridLayoutConfig
  gridWidth: number
  onSave: (updates: UserWidgetUpdate[]) => void
  saveDebounce?: number
  isAuthenticated: boolean
}

interface UseGridLayoutManagerReturn {
  layout: Layout[]
  handleDragStart: (
    layout: Layout[],
    oldItem: Layout,
    newItem: Layout,
    placeholder: Layout,
    event: MouseEvent,
    element: HTMLElement
  ) => void
  handleDrag: (
    layout: Layout[],
    oldItem: Layout,
    newItem: Layout,
    placeholder: Layout,
    event: MouseEvent,
    element: HTMLElement
  ) => void
  handleDragStop: (
    layout: Layout[],
    oldItem: Layout,
    newItem: Layout,
    placeholder: Layout,
    event: MouseEvent,
    element: HTMLElement
  ) => void
  insertWidget: (widgetId: string, atIndex?: number) => void
  maxRows: number
}

/**
 * Custom hook for managing grid layout with order-based positioning.
 *
 * Performance optimizations:
 * - Uses refs to track drag state without triggering re-renders
 * - Only updates preview order when target index actually changes
 * - Minimizes state updates during drag operations
 */
export function useGridLayoutManager({
  widgets,
  config,
  gridWidth,
  onSave,
  saveDebounce = 500,
  isAuthenticated,
}: UseGridLayoutManagerProps): UseGridLayoutManagerReturn {
  const { cols } = config

  // Widget order state - this is the source of truth
  const [widgetOrder, setWidgetOrder] = useState<string[]>([])

  // Refs to track drag state without causing re-renders
  const dragStateRef = useRef<{
    isDragging: boolean
    widgetId: string | null
    originalIndex: number
  }>({
    isDragging: false,
    widgetId: null,
    originalIndex: -1,
  })

  // Track if order has been initialized from widgets
  const isInitializedRef = useRef(false)

  // Store widgetOrder in ref for use in callbacks without dependencies
  const widgetOrderRef = useRef<string[]>([])
  widgetOrderRef.current = widgetOrder

  // Total items = widgets + add-widget button
  const totalItems = widgets.length + 1
  const maxRows = calculateMaxRows(totalItems, cols)
  const maxWidgetIndex = widgets.length - 1

  // Initialize order from widgets (sorted by position) on first load
  useEffect(() => {
    if (widgets.length > 0 && !isInitializedRef.current) {
      const initialOrder = sortWidgetsByPosition(widgets, cols)
      setWidgetOrder(initialOrder)
      isInitializedRef.current = true
    }
  }, [widgets, cols])

  // Sync order when widgets change (add/remove from other sources)
  useEffect(() => {
    if (!isInitializedRef.current || widgets.length === 0) return

    const syncedOrder = syncOrderWithWidgets(widgetOrder, widgets)

    // Only update if order actually changed
    if (
      syncedOrder.length !== widgetOrder.length ||
      syncedOrder.some((id, i) => widgetOrder[i] !== id)
    ) {
      setWidgetOrder(syncedOrder)
    }
  }, [widgets]) // Intentionally omit widgetOrder to avoid infinite loops

  // Debounced save function
  const debouncedSave = useDebouncedCallback((order: string[]) => {
    if (!isAuthenticated) return
    const updates = orderToPositionUpdates(order, cols)
    onSave(updates)
  }, saveDebounce)

  // Generate layout from widget order
  const layout = useMemo(() => {
    if (widgetOrder.length === 0) {
      // Fallback: generate layout directly from widgets array
      const fallbackLayout: Layout[] = widgets.map((widget, index) => ({
        i: widget.widgetId,
        ...indexToPosition(index, cols),
        w: 1,
        h: 1,
      }))

      if (isAuthenticated) {
        fallbackLayout.push({
          i: 'add-widget',
          ...indexToPosition(widgets.length, cols),
          w: 1,
          h: 1,
          static: true,
        })
      }

      return fallbackLayout
    }

    return orderToLayout(widgetOrder, cols, isAuthenticated)
  }, [widgetOrder, widgets, cols, isAuthenticated])

  // Handle drag start - just mark that we're dragging
  const handleDragStart = useCallback(
    (
      _layout: Layout[],
      oldItem: Layout,
      _newItem: Layout,
      _placeholder: Layout,
      _event: MouseEvent,
      _element: HTMLElement
    ) => {
      if (!isAuthenticated || oldItem.i === 'add-widget') return

      dragStateRef.current = {
        isDragging: true,
        widgetId: oldItem.i,
        originalIndex: widgetOrderRef.current.indexOf(oldItem.i),
      }
    },
    [isAuthenticated]
  )

  // Handle drag - no-op, let react-grid-layout handle visual feedback
  const handleDrag = useCallback(
    (
      _layout: Layout[],
      _oldItem: Layout,
      _newItem: Layout,
      _placeholder: Layout,
      _event: MouseEvent,
      _element: HTMLElement
    ) => {
      // Intentionally empty - we only reorder on drop for smooth performance
    },
    []
  )

  // Handle drag stop (commit change)
  const handleDragStop = useCallback(
    (
      _layout: Layout[],
      _oldItem: Layout,
      newItem: Layout,
      _placeholder: Layout,
      _event: MouseEvent,
      _element: HTMLElement
    ) => {
      const dragState = dragStateRef.current

      if (!dragState.isDragging || !dragState.widgetId) {
        resetDragState()
        return
      }

      if (dragState.widgetId === 'add-widget') {
        resetDragState()
        return
      }

      // Calculate final target index
      const targetIndex = calculateTargetIndex(newItem.x, newItem.y, cols, maxWidgetIndex)
      const fromIndex = dragState.originalIndex

      if (targetIndex !== fromIndex && targetIndex >= 0 && targetIndex <= maxWidgetIndex) {
        const newOrder = reorderArray(widgetOrderRef.current, fromIndex, targetIndex)
        setWidgetOrder(newOrder)
        debouncedSave(newOrder)
      }

      resetDragState()
    },
    [cols, maxWidgetIndex, debouncedSave]
  )

  // Reset drag state helper
  const resetDragState = () => {
    dragStateRef.current = {
      isDragging: false,
      widgetId: null,
      originalIndex: -1,
    }
  }

  // Insert widget at specific index (for add widget functionality)
  const insertWidget = useCallback(
    (widgetId: string, atIndex?: number) => {
      const currentOrder = widgetOrderRef.current
      const index = atIndex ?? currentOrder.length
      const newOrder = [...currentOrder]
      newOrder.splice(index, 0, widgetId)
      setWidgetOrder(newOrder)
      debouncedSave(newOrder)
    },
    [debouncedSave]
  )

  return {
    layout,
    handleDragStart,
    handleDrag,
    handleDragStop,
    insertWidget,
    maxRows,
  }
}
