import React from 'react'
import './AdminModal.css'
import { useBlockSpotlight } from '../context/MousePositionContext'
import { CloseIcon } from './icons'

interface AdminModalProps {
    onClose: () => void
    onManageGlobalWidgets: () => void
    onManageUsers: () => void
}

const AdminModal: React.FC<AdminModalProps> = ({ onClose, onManageGlobalWidgets, onManageUsers }) => {
    useBlockSpotlight(true)

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose()
    }

    return (
        <div className="admin-modal-overlay" onClick={handleOverlayClick}>
            <div className="admin-modal">
                <div className="admin-modal-header">
                    <h2 className="admin-modal-title">Admin Einstellungen</h2>
                    <button className="admin-modal-close" onClick={onClose} aria-label="Schließen"><CloseIcon /></button>
                </div>

                <div className="admin-modal-content">
                    <p className="admin-modal-hint">
                        <strong>Achtung:</strong> Änderungen sind global und betreffen alle Benutzer.
                    </p>

                    <div className="admin-actions">
                        <button
                            className="settings-button secondary"
                            onClick={onManageGlobalWidgets}
                        >
                            Globale Widgets verwalten
                        </button>

                        <button
                            className="settings-button secondary"
                            onClick={onManageUsers}
                        >
                            Nutzer verwalten
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminModal
