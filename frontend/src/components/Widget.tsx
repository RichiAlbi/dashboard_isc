import React, { useRef } from 'react'
import { useSpotlight } from '../hooks/useSpotlight'
import { BinIcon, DragHandleIcon } from './icons'
import './Widget.css'

interface WidgetProps {
  title: string
  icon?: React.ReactNode
  color: string
  target?: string
  onDelete?: () => void
  showControls?: boolean // Show drag handle and delete button
  onNavigate?: (url: string, title: string) => void // Callback to open URL in embedded view
}

const Widget: React.FC<WidgetProps> = ({ title, icon, color, target, onDelete, showControls = false, onNavigate }) => {
  const { containerRef, isHovering, position } = useSpotlight()
  const isDragging = useRef(false)

  const spotlightStyle = {
    '--spotlight-color': color,
    '--spotlight-x': `${position.x}px`,
    '--spotlight-y': `${position.y}px`,
    '--spotlight-opacity': isHovering ? 1 : 0,
  } as React.CSSProperties

  const handleDragStart = () => {
    isDragging.current = true
  }

  const handleClick = () => {
    if (isDragging.current) {
      isDragging.current = false
      return
    }

    if (target) {
      if (onNavigate) {
        onNavigate(target, title)
      } else {
        // Fallback: open in new tab if no onNavigate provided
        window.open(target, '_blank')
      }
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  return (
    <div
      ref={containerRef}
      className="widget"
      style={spotlightStyle}
      onClick={handleClick}
    >
      {showControls && (
        <>
          <button
            className="widget-drag-handle react-grid-drag-handle"
            onMouseDown={handleDragStart}
            aria-label="Widget verschieben"
          >
            <DragHandleIcon />
          </button>
          <button
            className="widget-delete-button"
            onClick={handleDelete}
            aria-label="Widget löschen"
          >
            <BinIcon />
          </button>
        </>
      )}
      {icon && <div className="widget-icon">{icon}</div>}
      <div className="widget-title">{title}</div>
    </div>
  )
}

export default Widget
