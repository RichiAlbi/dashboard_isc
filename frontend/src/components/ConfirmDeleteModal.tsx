import React from 'react'
import { useBlockSpotlight } from '../context/MousePositionContext'
import './ConfirmDeleteModal.css'
import { CloseIcon } from './icons'

interface ConfirmDeleteModalProps {
  title: string
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  title,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  useBlockSpotlight(true)

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) onClose()
  }

  return (
    <div className="confirm-modal-overlay" onClick={handleOverlayClick}>
      <div className="confirm-modal" role="dialog" aria-modal="true" aria-label="Löschen bestätigen">
        <div className="confirm-modal-header">
          <h2 className="confirm-modal-title">Löschen</h2>
          <button
            className="confirm-modal-close"
            onClick={onClose}
            aria-label="Schließen"
            disabled={isLoading}
          ><CloseIcon /></button>
        </div>

        <div className="confirm-modal-body">
          Soll &quot;{title}&quot; wirklich gelöscht werden?
        </div>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-modal-button secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Abbrechen
          </button>

          <button
            type="button"
            className="confirm-modal-button danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal
