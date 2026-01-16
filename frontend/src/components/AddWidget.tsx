import React, { useState } from 'react'
import { useSpotlight } from '../hooks/useSpotlight'
import { PlusIcon, CloseIcon } from './icons'
import type { UserWidget } from '../types/widget'
import './AddWidget.css'

interface AddWidgetProps {
  hiddenWidgets?: UserWidget[]
  onAddWidget?: (widgetId: string) => void
  isLoading?: boolean
}

const AddWidget: React.FC<AddWidgetProps> = ({ hiddenWidgets = [], onAddWidget, isLoading = false }) => {
  const { containerRef, isHovering, position } = useSpotlight()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const spotlightStyle = {
    '--spotlight-color': 'var(--color-primary)',
    '--spotlight-x': `${position.x}px`,
    '--spotlight-y': `${position.y}px`,
    '--spotlight-opacity': isHovering ? 1 : 0,
  } as React.CSSProperties

  const handleClick = () => {
    setIsModalOpen(true)
  }

  const handleAddWidget = (widgetId: string) => {
    if (onAddWidget) {
      onAddWidget(widgetId)
    }
    setIsModalOpen(false)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`add-widget ${isModalOpen ? 'add-widget-hidden' : ''}`}
        style={spotlightStyle}
        onClick={handleClick}
      >
        <div className="add-widget-icon">
          <PlusIcon />
        </div>
      </div>

      {isModalOpen && (
        <div className="add-widget-modal-overlay" onClick={handleCloseModal}>
          <div className="add-widget-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-widget-modal-header">
              <h2>Widget hinzufügen</h2>
              <button className="add-widget-modal-close" onClick={handleCloseModal}>
                <CloseIcon />
              </button>
            </div>
            <div className="add-widget-modal-content">
              {isLoading ? (
                <div className="add-widget-loading">Widgets werden geladen...</div>
              ) : hiddenWidgets.length === 0 ? (
                <div className="add-widget-empty">
                  Keine weiteren Widgets verfügbar
                </div>
              ) : (
                <ul className="add-widget-list">
                  {hiddenWidgets.map((widget) => (
                    <li
                      key={widget.widgetId}
                      className="add-widget-list-item"
                      onClick={() => handleAddWidget(widget.widgetId)}
                    >
                      <span
                        className="add-widget-list-item-color"
                        style={{ backgroundColor: widget.color }}
                      />
                      <span className="add-widget-list-item-title">{widget.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AddWidget
