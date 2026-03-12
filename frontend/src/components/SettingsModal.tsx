import React, { useState } from 'react'
import { useBlockSpotlight } from '../context/MousePositionContext'
import { useZoom, type ZoomLevel } from '../context/ZoomContext'
import { useWidgetHover } from '../context/WidgetHoverContext'
import './SettingsModal.css'
import { useAuth } from '../context/AuthContext'

interface SettingsModalProps {
  onClose: () => void
  isAuthenticated: boolean
  onResetLayout: () => void
  isResetting?: boolean
  onOpenAdmin: () => void
}

const ZOOM_LABELS: Record<ZoomLevel, string> = {
  1: 'Klein',
  2: 'Normal',
  3: 'Groß',
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  isAuthenticated,
  onResetLayout,
  isResetting = false,
  onOpenAdmin,
}) => {
  const { zoomLevel, setZoomLevel } = useZoom()
  const { widgetColorEnabled, setWidgetColorEnabled } = useWidgetHover()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const { isAdmin } = useAuth()

  // Block spotlight effect while modal is open
  useBlockSpotlight(true)

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleResetClick = () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true)
    } else {
      onResetLayout()
      setShowResetConfirm(false)
    }
  }

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) as ZoomLevel
    setZoomLevel(value)
  }

  return (
    <div className="settings-modal-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">Einstellungen</h2>
          <button
            className="settings-modal-close"
            onClick={onClose}
            aria-label="Schließen"
          >
            ×
          </button>
        </div>

        <div className="settings-modal-content">
          {/* Zoom Setting */}
          <div className="settings-section">
            <div className="settings-section-header">
              <h3 className="settings-section-title">Textgröße</h3>
              <span className="settings-section-value">{ZOOM_LABELS[zoomLevel]}</span>
            </div>
            <div className="settings-slider-container">
              <span className="settings-slider-label">A</span>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={zoomLevel}
                onChange={handleZoomChange}
                className="settings-slider"
                aria-label="Textgröße anpassen"
              />
              <span className="settings-slider-label large">A</span>
            </div>
            <div className="settings-slider-marks">
              <span>Klein</span>
              <span>Normal</span>
              <span>Groß</span>
            </div>
          </div>

          {/* Widget Color on Background Setting */}
          <div className="settings-section">
            <div className="settings-section-header">
              <h3 className="settings-section-title">Hintergrundfarbe</h3>
              <label className="settings-toggle" aria-label="Hintergrundfarbe aktivieren">
                <input
                  type="checkbox"
                  checked={widgetColorEnabled}
                  onChange={e => setWidgetColorEnabled(e.target.checked)}
                />
                <span className="settings-toggle-track">
                  <span className="settings-toggle-thumb" />
                </span>
              </label>
            </div>
            <p className="settings-section-description">
              Die Auswahl-Farbe des Widgets wird mit dem Hintergrund synchronisiert.
            </p>
          </div>

          {/* Reset Layout Setting - Always visible, disabled when not authenticated */}
          <div className="settings-section">
            <div className="settings-section-header">
              <h3 className="settings-section-title">Layout zurücksetzen</h3>
            </div>
            <p className="settings-section-description">
              {isAuthenticated
                ? 'Setzt Anordnung und Widget-Sichtbarkeit auf die Standardansicht zurück.'
                : 'Melden Sie sich an, um Ihr Layout zurückzusetzen.'}
            </p>
            <div className="settings-reset-actions">
              {showResetConfirm && isAuthenticated ? (
                <>
                  <span className="settings-reset-confirm-text">Sind Sie sicher?</span>
                  <button
                    className="settings-button secondary"
                    onClick={() => setShowResetConfirm(false)}
                    disabled={isResetting}
                  >
                    Abbrechen
                  </button>
                  <button
                    className="settings-button danger"
                    onClick={handleResetClick}
                    disabled={isResetting}
                  >
                    {isResetting ? 'Wird zurückgesetzt...' : 'Bestätigen'}
                  </button>
                </>
              ) : (
                <button
                  className="settings-button secondary"
                  onClick={handleResetClick}
                  disabled={!isAuthenticated || isResetting}
                >
                  Zurücksetzen
                </button>
              )}
            </div>
          </div>

          {/* Admin Einstellungen */}
          {isAuthenticated && isAdmin && !isResetting && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3 className="settings-section-title">Admin Einstellungen</h3>
                </div>

                <p className="settings-section-description">
                  Erweiterte Einstellungen für Administratoren.
                </p>

                <div className="settings-reset-actions">
                  <button
                      className="settings-button secondary"
                      onClick={onOpenAdmin}
                  >
                    Einstellungen
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
