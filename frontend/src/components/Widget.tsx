import React from 'react'
import { useSpotlight } from '../hooks/useSpotlight'
import './Widget.css'

interface WidgetProps {
  title: string
  icon?: React.ReactNode
  color: string
}

const Widget: React.FC<WidgetProps> = ({ title, icon, color }) => {
  const { containerRef, isHovering, position } = useSpotlight()

  const spotlightStyle = {
    '--spotlight-color': color,
    '--spotlight-x': `${position.x}px`,
    '--spotlight-y': `${position.y}px`,
    '--spotlight-opacity': isHovering ? 1 : 0,
  } as React.CSSProperties

  return (
    <div
      ref={containerRef}
      className="widget"
      style={spotlightStyle}
    >
      {icon && <div className="widget-icon">{icon}</div>}
      <div className="widget-title">{title}</div>
    </div>
  )
}

export default Widget
