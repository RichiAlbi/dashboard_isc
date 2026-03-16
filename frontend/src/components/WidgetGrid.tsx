import React, { useRef, useCallback, useLayoutEffect, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useWidgetDrag, type DropTarget } from '../hooks/useWidgetDrag'
import './WidgetGrid.css'

export interface WidgetCellProps {
  /** Attach to the drag handle element */
  onDragHandlePointerDown: (e: React.PointerEvent) => void
  /** True while this widget is the one being dragged (source slot is faded) */
  isDragging: boolean
}

interface WidgetGridProps {
  widgetOrder: string[]
  isInteractive: boolean
  onDrop: (sourceIndex: number, target: DropTarget) => void
  cols?: number
  renderWidget: (id: string, cellProps: WidgetCellProps) => React.ReactNode
  renderAddWidget: () => React.ReactNode
}

// Must match --widget-grid-gap in WidgetGrid.css
const GRID_GAP_PX = 16

/**
 * Row count range for height clamping.
 * Below MIN_ROWS the cells stay at their max size (empty space below).
 * Above MAX_ROWS the cells stay at their min size (scrolls if needed).
 */
const MIN_ROWS = 2
const MAX_ROWS = 4

export function WidgetGrid({
  widgetOrder,
  isInteractive,
  onDrop,
  cols = 3,
  renderWidget,
  renderAddWidget,
}: WidgetGridProps) {
  const cellRefs = useRef<(HTMLDivElement | null)[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [availableHeight, setAvailableHeight] = useState(0)

  // Keep a ref so closures inside useWidgetDrag always see the latest order
  const widgetOrderRef = useRef(widgetOrder)
  widgetOrderRef.current = widgetOrder

  // FLIP animation state
  const prevOrderRef = useRef<string[]>([])
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map())
  const lastDropSourceIdRef = useRef<string | null>(null)

  /**
   * Measure available height for the grid.
   *
   * Uses the wrapper's top position (= header bottom edge) and the parent's
   * padding-bottom to compute how much vertical space the grid can occupy.
   * A ResizeObserver on the parent element re-triggers this whenever the
   * header size changes (e.g. zoom factor change) or the window resizes.
   */
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const parent = wrapper.parentElement

    const measure = () => {
      if (!parent) return
      const style = getComputedStyle(parent)
      const paddingTop = parseFloat(style.paddingTop)
      const paddingBottom = parseFloat(style.paddingBottom)
      setAvailableHeight(parent.getBoundingClientRect().height - paddingTop - paddingBottom)
    }

    measure()

    const observer = new ResizeObserver(measure)
    if (parent) observer.observe(parent)

    return () => observer.disconnect()
  }, [])

  /**
   * Compute row height from available height and clamped row count.
   *
   * The actual row count is clamped to [MIN_ROWS, MAX_ROWS].
   * - Fewer rows than MIN_ROWS → cells are at maximum size, space below unused
   * - More rows than MAX_ROWS → cells are at minimum size, content may scroll
   */
  const totalItems = widgetOrder.length + (isInteractive ? 1 : 0)
  const actualRows = Math.ceil(totalItems / cols)
  const clampedRows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, actualRows))
  const rowHeight =
    availableHeight > 0
      ? Math.floor((availableHeight - (clampedRows - 1) * GRID_GAP_PX) / clampedRows)
      : undefined

  // Wrap onDrop so we can record the source widget before the order changes
  const wrappedOnDrop = useCallback(
    (sourceIndex: number, target: DropTarget) => {
      lastDropSourceIdRef.current = widgetOrderRef.current[sourceIndex]
      onDrop(sourceIndex, target)
    },
    [onDrop]
  )

  const { dragVisuals, startDrag } = useWidgetDrag({
    widgetCount: widgetOrder.length,
    onDrop: wrappedOnDrop,
  })

  const handleDragHandlePointerDown = useCallback(
    (sourceIndex: number, e: React.PointerEvent) => {
      const cell = cellRefs.current[sourceIndex]
      if (!cell) return
      startDrag(sourceIndex, e, cell)
    },
    [startDrag]
  )

  /**
   * FLIP animation for passively shifted widgets.
   * See previous implementation for full explanation.
   */
  useLayoutEffect(() => {
    const prevOrder = prevOrderRef.current
    const currentOrder = widgetOrder

    const orderChanged =
      prevOrder.length === currentOrder.length &&
      prevOrder.length > 0 &&
      prevOrder.some((id, i) => currentOrder[i] !== id)

    if (orderChanged && !dragVisuals) {
      const droppedId = lastDropSourceIdRef.current

      currentOrder.forEach((id, i) => {
        const cell = cellRefs.current[i]
        if (!cell) return

        const newRect = cell.getBoundingClientRect()

        if (id === droppedId) {
          cell.animate(
            [
              { transform: 'scale(0.93)', opacity: '0.6' },
              { transform: 'scale(1)', opacity: '1' },
            ],
            { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
          )
          return
        }

        const prevRect = prevRectsRef.current.get(id)
        if (!prevRect) return

        const dx = prevRect.left - newRect.left
        const dy = prevRect.top - newRect.top

        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          cell.animate(
            [
              { transform: `translate(${dx}px, ${dy}px)` },
              { transform: 'translate(0, 0)' },
            ],
            { duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
          )
        }
      })

      lastDropSourceIdRef.current = null
    }

    prevOrderRef.current = [...currentOrder]
    const rects = new Map<string, DOMRect>()
    currentOrder.forEach((id, i) => {
      const cell = cellRefs.current[i]
      if (cell) rects.set(id, cell.getBoundingClientRect())
    })
    prevRectsRef.current = rects
  })

  const dropTarget = dragVisuals?.dropTarget ?? null

  const gridStyle = {
    '--widget-grid-cols': cols,
    '--widget-row-height': rowHeight != null ? `${rowHeight}px` : undefined,
  } as React.CSSProperties

  return (
    <div ref={wrapperRef}>
      <div className="widget-grid" style={gridStyle}>
        {widgetOrder.map((id, index) => {
          const isSource = dragVisuals?.sourceIndex === index
          const isSwapTarget = dropTarget?.type === 'swap' && dropTarget.index === index
          const isInsertBefore =
            dropTarget?.type === 'insert' && dropTarget.beforeIndex === index

          const classes = [
            'widget-grid-cell',
            isSource ? 'widget-grid-cell--source' : '',
            isSwapTarget ? 'widget-grid-cell--swap-target' : '',
            isInsertBefore ? 'widget-grid-cell--insert-before' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <div
              key={id}
              ref={el => {
                cellRefs.current[index] = el
              }}
              className={classes}
              data-drag-index={index}
            >
              {renderWidget(id, {
                onDragHandlePointerDown: (e: React.PointerEvent) =>
                  handleDragHandlePointerDown(index, e),
                isDragging: isSource,
              })}
            </div>
          )
        })}

        {isInteractive && (
          <div
            className={[
              'widget-grid-cell',
              'widget-grid-cell--add',
              dropTarget?.type === 'insert' &&
              dropTarget.beforeIndex === widgetOrder.length
                ? 'widget-grid-cell--insert-before'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            data-drag-index={widgetOrder.length}
          >
            {renderAddWidget()}
          </div>
        )}

        {dragVisuals &&
          createPortal(
            <div
              className="widget-ghost"
              style={{
                left: dragVisuals.ghostX,
                top: dragVisuals.ghostY,
                width: dragVisuals.ghostWidth,
                height: dragVisuals.ghostHeight,
              }}
            >
              {renderWidget(widgetOrder[dragVisuals.sourceIndex], {
                onDragHandlePointerDown: () => {},
                isDragging: false,
              })}
            </div>,
            document.body
          )}
      </div>
    </div>
  )
}
