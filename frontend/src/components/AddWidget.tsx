import React from 'react'
import { useSpotlight } from '../hooks/useSpotlight'
import { PlusIcon } from './icons'
import './AddWidget.css'

const AddWidget: React.FC = () => {
  const { containerRef, isHovering, position } = useSpotlight()

  const spotlightStyle = {
    '--spotlight-color': 'var(--color-primary)',
    '--spotlight-x': `${position.x}px`,
    '--spotlight-y': `${position.y}px`,
    '--spotlight-opacity': isHovering ? 1 : 0,
  } as React.CSSProperties

  return (
    <div
      ref={containerRef}
      className="add-widget"
      style={spotlightStyle}
    >
      <div className="add-widget-icon">
        <PlusIcon />
      </div>
    </div>
  )
}

export default AddWidget
