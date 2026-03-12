import React, { useState, useCallback, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useSpotlight } from '../hooks/useSpotlight'
import { PlusIcon } from './icons'
import { getIcon } from '../utils/iconMapping'
import type { UserWidget } from '../types/widget'
import './AddWidget.css'

interface AddWidgetProps {
  hiddenWidgets?: UserWidget[]
  onAddWidget?: (widgetId: string) => void
  isLoading?: boolean
}

const AddWidget: React.FC<AddWidgetProps> = ({ hiddenWidgets = [], onAddWidget, isLoading = false }) => {
  const { containerRef, isHovering, position } = useSpotlight()
  const [isOpen, setIsOpen] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const spotlightStyle = {
    '--spotlight-color': 'var(--color-primary)',
    '--spotlight-x': `${position.x}px`,
    '--spotlight-y': `${position.y}px`,
    '--spotlight-opacity': isHovering ? 1 : 0,
  } as React.CSSProperties

  const handleClick = () => {
    if (isLoading) return
    if (hiddenWidgets.length === 0) {
      setIsPulsing(false)
      requestAnimationFrame(() => requestAnimationFrame(() => setIsPulsing(true)))
    } else {
      setIsOpen(true)
    }
  }

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setSelectedIds(new Set())
  }, [])

  const toggleSelect = (widgetId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(widgetId)) {
        next.delete(widgetId)
      } else {
        next.add(widgetId)
      }
      return next
    })
  }

  const handleConfirm = () => {
    selectedIds.forEach((id) => onAddWidget?.(id))
    handleClose()
  }

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, handleClose])

  const overlay = isOpen
    ? ReactDOM.createPortal(
        <div className="aw-overlay" onClick={handleClose}>
          <div className="aw-list-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className="aw-list-scroll">
              {hiddenWidgets.map((widget) => {
                const icon = getIcon(widget.icon)
                const selected = selectedIds.has(widget.widgetId)
                return (
                  <button
                    key={widget.widgetId}
                    className={`aw-item${selected ? ' aw-item-selected' : ''}`}
                    onClick={() => toggleSelect(widget.widgetId)}
                  >
                    <span className="aw-item-icon">
                      {icon ?? <span className="aw-item-color-dot" style={{ backgroundColor: widget.color }} />}
                    </span>
                    <span className="aw-item-title">{widget.title}</span>
                    {selected && <span className="aw-item-check" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedIds.size > 0 && (
            <button
              className="aw-confirm-button"
              onClick={(e) => { e.stopPropagation(); handleConfirm() }}
            >
              Hinzufügen{selectedIds.size > 1 ? ` (${selectedIds.size})` : ''}
            </button>
          )}
        </div>,
        document.body
      )
    : null

  return (
    <>
      <div
        ref={containerRef}
        className={`add-widget${isPulsing ? ' add-widget-pulse-red' : ''}`}
        style={spotlightStyle}
        onClick={handleClick}
        onAnimationEnd={() => setIsPulsing(false)}
      >
        <div className="add-widget-icon">
          <PlusIcon />
        </div>
      </div>

      {overlay}
    </>
  )
}

export default AddWidget
