import type { Layout } from 'react-grid-layout'
import type { UserWidget, UserWidgetUpdate, WidgetPosition } from '../types/widget'

/**
 * Grid layout utility functions for order-based widget positioning.
 * The core concept: widget ORDER is the source of truth, positions are derived.
 */

/**
 * Convert a linear index to grid position (x, y)
 * Index 0 = (0,0), Index 1 = (1,0), Index 2 = (2,0), Index 3 = (0,1), etc.
 */
export function indexToPosition(index: number, cols: number): WidgetPosition {
  return {
    x: index % cols,
    y: Math.floor(index / cols),
  }
}

/**
 * Convert grid position (x, y) to linear index
 */
export function positionToIndex(x: number, y: number, cols: number): number {
  return y * cols + x
}

/**
 * Calculate the maximum number of rows based on total item count
 * Includes the add-widget button in the count
 */
export function calculateMaxRows(itemCount: number, cols: number): number {
  return Math.ceil(itemCount / cols)
}

/**
 * Calculate the target index when dropping a widget at a grid position.
 * Clamps the result to valid bounds [0, maxIndex].
 */
export function calculateTargetIndex(
  x: number,
  y: number,
  cols: number,
  maxIndex: number
): number {
  const rawIndex = positionToIndex(x, y, cols)
  return Math.max(0, Math.min(rawIndex, maxIndex))
}

/**
 * Reorder an array by moving an item from one index to another.
 * Implements splice-like behavior: items between shift to fill/make room.
 *
 * Example: reorderArray([A,B,C,D,E], 4, 1) → [A,E,B,C,D]
 * (E moves from index 4 to index 1, B,C,D shift right)
 */
export function reorderArray<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return arr
  if (fromIndex < 0 || toIndex < 0) return arr
  if (fromIndex >= arr.length || toIndex >= arr.length) return arr

  const result = [...arr]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

/**
 * Sort widgets by their stored grid position to derive initial order.
 * Widgets without config are placed at the end.
 */
export function sortWidgetsByPosition(widgets: UserWidget[], cols: number): string[] {
  return [...widgets]
    .sort((a, b) => {
      const indexA = a.config ? positionToIndex(a.config.x, a.config.y, cols) : Infinity
      const indexB = b.config ? positionToIndex(b.config.x, b.config.y, cols) : Infinity
      return indexA - indexB
    })
    .map(w => w.widgetId)
}

/**
 * Generate react-grid-layout Layout array from widget order.
 * Optionally includes the static add-widget button at the end.
 */
export function orderToLayout(
  order: string[],
  cols: number,
  includeAddWidget: boolean = true
): Layout[] {
  const layout: Layout[] = order.map((widgetId, index) => ({
    i: widgetId,
    ...indexToPosition(index, cols),
    w: 1,
    h: 1,
  }))

  if (includeAddWidget) {
    layout.push({
      i: 'add-widget',
      ...indexToPosition(order.length, cols),
      w: 1,
      h: 1,
      static: true,
    })
  }

  return layout
}

/**
 * Convert widget order to position updates for backend persistence.
 * Each widget gets {x, y} coordinates derived from its index in the order.
 */
export function orderToPositionUpdates(order: string[], cols: number): UserWidgetUpdate[] {
  return order.map((widgetId, index) => ({
    widgetId,
    config: indexToPosition(index, cols),
  }))
}

/**
 * Synchronize widget order with current widgets.
 * - Removes IDs that no longer exist in widgets
 * - Appends new widget IDs at the end
 */
export function syncOrderWithWidgets(
  currentOrder: string[],
  widgets: UserWidget[]
): string[] {
  const widgetIds = new Set(widgets.map(w => w.widgetId))

  // Keep only IDs that still exist
  const filteredOrder = currentOrder.filter(id => widgetIds.has(id))

  // Find new widgets not in current order
  const orderSet = new Set(currentOrder)
  const newWidgetIds = widgets
    .filter(w => !orderSet.has(w.widgetId))
    .map(w => w.widgetId)

  return [...filteredOrder, ...newWidgetIds]
}
