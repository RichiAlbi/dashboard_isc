import { useState, useCallback } from 'react'

export type DropTarget =
  | { type: 'swap'; index: number }
  | { type: 'insert'; beforeIndex: number }

interface DragVisuals {
  sourceIndex: number
  ghostX: number
  ghostY: number
  ghostWidth: number
  ghostHeight: number
  dropTarget: DropTarget | null
}

interface UseWidgetDragProps {
  widgetCount: number
  onDrop: (sourceIndex: number, target: DropTarget) => void
}

export interface UseWidgetDragReturn {
  dragVisuals: DragVisuals | null
  startDrag: (sourceIndex: number, e: React.PointerEvent, cellElement: HTMLElement) => void
}

// Must match --widget-grid-gap in WidgetGrid.css
const GRID_GAP_PX = 16

/**
 * Pixel margin inside each cell that activates insert mode.
 * Kept small so it only covers the gap's "overhang" into the widget.
 * The gap itself is handled by the fallback path.
 */
const INSERT_ZONE_PX = 8

/** Returns null if an insert result would not change the order. */
function filterNoOpInsert(result: DropTarget, sourceIndex: number): DropTarget | null {
  if (result.type === 'insert') {
    const toIndex =
      sourceIndex < result.beforeIndex ? result.beforeIndex - 1 : result.beforeIndex
    if (toIndex === sourceIndex) return null
  }
  return result
}

export function useWidgetDrag({ widgetCount, onDrop }: UseWidgetDragProps): UseWidgetDragReturn {
  const [dragVisuals, setDragVisuals] = useState<DragVisuals | null>(null)

  /**
   * Find the drop target under the cursor.
   *
   * PRIMARY PATH — cursor is over a cell:
   *   Within INSERT_ZONE_PX of the left/right edge → insert.
   *   Elsewhere → swap.
   *
   * FALLBACK PATH — cursor is in a gap (elementFromPoint returns the grid
   *   container, not a cell):
   *   Iterate all cell rects and find the nearest cell edge within the gap.
   *   The threshold (GRID_GAP_PX + 1) always matches somewhere in the gap
   *   since the cursor is at most GRID_GAP_PX/2 from a cell edge there.
   *
   * Combined result: the separator activates across the full 16 px gap
   * plus INSERT_ZONE_PX pixels into each neighbouring cell.
   */
  const findDropTarget = useCallback(
    (clientX: number, clientY: number, sourceIndex: number): DropTarget | null => {
      const element = document.elementFromPoint(clientX, clientY)
      const cell = element
        ? (element.closest('[data-drag-index]') as HTMLElement | null)
        : null

      if (cell) {
        // ── Cursor is directly over a cell ──────────────────────────────
        const indexAttr = cell.getAttribute('data-drag-index')
        if (!indexAttr) return null
        const index = parseInt(indexAttr, 10)
        if (isNaN(index) || index === sourceIndex) return null

        // Add-widget cell → insert at end
        if (index === widgetCount) {
          return { type: 'insert', beforeIndex: widgetCount }
        }

        const rect = cell.getBoundingClientRect()
        const fromLeft = clientX - rect.left
        const fromRight = rect.right - clientX

        let result: DropTarget
        if (fromLeft < INSERT_ZONE_PX) {
          result = { type: 'insert', beforeIndex: index }
        } else if (fromRight < INSERT_ZONE_PX) {
          result = { type: 'insert', beforeIndex: index + 1 }
        } else {
          result = { type: 'swap', index }
        }

        return filterNoOpInsert(result, sourceIndex)
      }

      // ── Cursor is in a gap — scan all cell edges ─────────────────────
      // elementFromPoint returned a non-cell element (e.g. the grid container).
      // Find the closest cell edge whose cell's Y-range contains the cursor.
      const allCells = document.querySelectorAll('[data-drag-index]')
      let bestDist = GRID_GAP_PX + 1 // accept anything within the gap
      let bestResult: DropTarget | null = null

      allCells.forEach(el => {
        const cellEl = el as HTMLElement
        const idx = parseInt(cellEl.getAttribute('data-drag-index') ?? '', 10)
        // Skip invalid, add-widget, or source cell
        if (isNaN(idx) || idx === widgetCount || idx === sourceIndex) return

        const rect = cellEl.getBoundingClientRect()

        // Only consider cells whose vertical span contains the cursor
        if (clientY < rect.top || clientY > rect.bottom) return

        const distLeft = Math.abs(clientX - rect.left)
        const distRight = Math.abs(clientX - rect.right)

        if (distLeft < bestDist) {
          bestDist = distLeft
          bestResult = { type: 'insert', beforeIndex: idx }
        }
        if (distRight < bestDist) {
          bestDist = distRight
          bestResult = { type: 'insert', beforeIndex: idx + 1 }
        }
      })

      return bestResult ? filterNoOpInsert(bestResult, sourceIndex) : null
    },
    [widgetCount]
  )

  const startDrag = useCallback(
    (sourceIndex: number, e: React.PointerEvent, cellElement: HTMLElement) => {
      const rect = cellElement.getBoundingClientRect()
      const grabOffsetX = e.clientX - rect.left
      const grabOffsetY = e.clientY - rect.top

      setDragVisuals({
        sourceIndex,
        ghostX: rect.left,
        ghostY: rect.top,
        ghostWidth: rect.width,
        ghostHeight: rect.height,
        dropTarget: null,
      })

      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'

      const handleMove = (moveEvent: PointerEvent) => {
        const ghostX = moveEvent.clientX - grabOffsetX
        const ghostY = moveEvent.clientY - grabOffsetY
        const dropTarget = findDropTarget(moveEvent.clientX, moveEvent.clientY, sourceIndex)
        setDragVisuals(prev => (prev ? { ...prev, ghostX, ghostY, dropTarget } : null))
      }

      const cleanup = () => {
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        document.removeEventListener('pointermove', handleMove)
        document.removeEventListener('pointerup', handleUp)
      }

      const handleUp = (upEvent: PointerEvent) => {
        const target = findDropTarget(upEvent.clientX, upEvent.clientY, sourceIndex)
        if (target !== null) {
          onDrop(sourceIndex, target)
        }
        setDragVisuals(null)
        cleanup()
      }

      document.addEventListener('pointermove', handleMove)
      document.addEventListener('pointerup', handleUp)
    },
    [findDropTarget, onDrop]
  )

  return { dragVisuals, startDrag }
}
