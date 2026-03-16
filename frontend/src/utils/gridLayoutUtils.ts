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
 * Swap two widgets by index. Used for direct swap drop behavior.
 */
export function swapWidgets(order: string[], i: number, j: number): string[] {
  if (i === j) return order
  const result = [...order]
  ;[result[i], result[j]] = [result[j], result[i]]
  return result
}

/**
 * Move a widget from one index to another, shifting others to fill the gap.
 * `toIndex` is the final position in the array after removal of `fromIndex`.
 *
 * Example: reorderArray([A,B,C,D,E], 4, 1) → [A,E,B,C,D]
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

  const filteredOrder = currentOrder.filter(id => widgetIds.has(id))

  const orderSet = new Set(currentOrder)
  const newWidgetIds = widgets
    .filter(w => !orderSet.has(w.widgetId))
    .map(w => w.widgetId)

  return [...filteredOrder, ...newWidgetIds]
}
