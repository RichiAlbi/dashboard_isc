import React from 'react'
import './Widget.css'

interface WidgetProps {
  title: string
  icon: React.ReactNode
  color: string
}

const Widget: React.FC<WidgetProps> = ({ title, icon, color }) => {
  return (
    <div className="widget" style={{ '--border-color': color } as React.CSSProperties & { '--border-color': string }}>
      <div className="widget-icon">{icon}</div>
      <div className="widget-title">{title}</div>
    </div>
  )
}

export default Widget
