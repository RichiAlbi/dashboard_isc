import { useState, useCallback, useEffect, useRef } from 'react'
import type { DropTarget } from './useWidgetDrag'
import type { UserWidget, UserWidgetUpdate } from '../types/widget'
import {
  swapWidgets,
  reorderArray,
  sortWidgetsByPosition,
  orderToPositionUpdates,
  syncOrderWithWidgets,
} from '../utils/gridLayoutUtils'
import { useDebouncedCallback } from './useDebouncedCallback'

interface UseGridLayoutManagerProps {
  widgets: UserWidget[]
  cols: number
  onSave: (updates: UserWidgetUpdate[]) => void
  saveDebounce?: number
  isAuthenticated: boolean
}

interface UseGridLayoutManagerReturn {
  widgetOrder: string[]
  handleDrop: (sourceIndex: number, target: DropTarget) => void
  insertWidget: (widgetId: string, atIndex?: number) => void
  removeWidget: (widgetId: string) => void
}

export function useGridLayoutManager({
  widgets,
  cols,
  onSave,
  saveDebounce = 500,
  isAuthenticated,
}: UseGridLayoutManagerProps): UseGridLayoutManagerReturn {
  const [widgetOrder, setWidgetOrder] = useState<string[]>([])

  const isInitializedRef = useRef(false)
  const widgetOrderRef = useRef<string[]>([])
  widgetOrderRef.current = widgetOrder

  // Initialize order from widgets (sorted by stored position) on first load
  useEffect(() => {
    if (widgets.length > 0 && !isInitializedRef.current) {
      setWidgetOrder(sortWidgetsByPosition(widgets, cols))
      isInitializedRef.current = true
    }
  }, [widgets, cols])

  // Sync order when widget list changes (add/remove)
  useEffect(() => {
    if (!isInitializedRef.current || widgets.length === 0) return

    const synced = syncOrderWithWidgets(widgetOrder, widgets)

    if (
      synced.length !== widgetOrder.length ||
      synced.some((id, i) => widgetOrder[i] !== id)
    ) {
      setWidgetOrder(synced)
    }
  }, [widgets]) // intentionally omit widgetOrder to avoid infinite loops

  const debouncedSave = useDebouncedCallback((order: string[]) => {
    if (!isAuthenticated) return
    onSave(orderToPositionUpdates(order, cols))
  }, saveDebounce)

  /**
   * Handle a drop event from the drag system.
   *
   * - swap: exchange source and target positions
   * - insert: remove from source, insert before target index (adjusting for removal shift)
   */
  const handleDrop = useCallback(
    (sourceIndex: number, target: DropTarget) => {
      const order = widgetOrderRef.current
      let newOrder: string[]

      if (target.type === 'swap') {
        newOrder = swapWidgets(order, sourceIndex, target.index)
      } else {
        // Convert beforeIndex (in original array) to toIndex (after removal)
        const toIndex =
          sourceIndex < target.beforeIndex
            ? target.beforeIndex - 1
            : target.beforeIndex
        newOrder = reorderArray(order, sourceIndex, toIndex)
      }

      setWidgetOrder(newOrder)
      debouncedSave(newOrder)
    },
    [debouncedSave]
  )

  const insertWidget = useCallback(
    (widgetId: string, atIndex?: number) => {
      const current = widgetOrderRef.current
      const index = atIndex ?? current.length
      const newOrder = [...current]
      newOrder.splice(index, 0, widgetId)
      setWidgetOrder(newOrder)
      debouncedSave(newOrder)
    },
    [debouncedSave]
  )

  const removeWidget = useCallback((widgetId: string) => {
    setWidgetOrder(widgetOrderRef.current.filter(id => id !== widgetId))
    // Position is saved separately when the widget is re-added
  }, [])

  return { widgetOrder, handleDrop, insertWidget, removeWidget }
}
