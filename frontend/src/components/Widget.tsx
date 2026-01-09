import React from 'react'
import { useSpotlight } from '../hooks/useSpotlight'
import { BinIcon } from './icons'
import './Widget.css'

interface WidgetProps {
  title: string
  icon?: React.ReactNode
  color: string
  onDelete?: () => void
}

const Widget: React.FC<WidgetProps> = ({ title, icon, color, onDelete }) => {
  const { containerRef, isHovering, position } = useSpotlight()

  const spotlightStyle = {
    '--spotlight-color': color,
    '--spotlight-x': `${position.x}px`,
    '--spotlight-y': `${position.y}px`,
    '--spotlight-opacity': isHovering ? 1 : 0,
  } as React.CSSProperties

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete()
    }
  }

  return (
    <div
      ref={containerRef}
      className="widget"
      style={spotlightStyle}
    >
      <button
        className="widget-delete-button"
        onClick={handleDelete}
        aria-label="Widget löschen"
      >
        <BinIcon />
      </button>
      {icon && <div className="widget-icon">{icon}</div>}
      <div className="widget-title">{title}</div>
    </div>
  )
}

export default Widget
