import React, { useMemo, useState } from 'react'
import { useBlockSpotlight } from '../context/MousePositionContext'
import './GlobalWidgetDeleteConfirmModal.css'

interface Props {
    title: string
    onClose: () => void
    onConfirm: () => void
    isLoading?: boolean
}

const GlobalWidgetDeleteConfirmModal: React.FC<Props> = ({
                                                             title,
                                                             onClose,
                                                             onConfirm,
                                                             isLoading = false,
                                                         }) => {
    useBlockSpotlight(true)

    const [typed, setTyped] = useState('')

    const canDelete = useMemo(() => {
        // “Extra confirm”: Name exakt eintippen
        return typed.trim() === title.trim()
    }, [typed, title])

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) onClose()
    }

    return (
        <div className="gwdc-overlay" onClick={handleOverlayClick}>
            <div className="gwdc-modal" role="dialog" aria-modal="true" aria-label="Globales Widget löschen">
                <div className="gwdc-header">
                    <h2 className="gwdc-title">Widget löschen</h2>
                    <button
                        className="gwdc-close"
                        onClick={onClose}
                        aria-label="Schließen"
                        disabled={isLoading}
                    >
                        ×
                    </button>
                </div>

                <div className="gwdc-body">
                    <div className="gwdc-text">
                        Soll das Widget <strong>&quot;{title}&quot;</strong> wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden!
                    </div>

                    <div className="gwdc-hint">
                        Zur Bestätigung den Namen exakt eintippen:
                        <strong> {title}</strong>
                    </div>

                    <input
                        className="gwdc-input"
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        placeholder={title}
                        disabled={isLoading}
                        autoFocus
                    />
                </div>

                <div className="gwdc-actions">
                    <button
                        type="button"
                        className="gwdc-btn secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Abbrechen
                    </button>

                    <button
                        type="button"
                        className="gwdc-btn danger"
                        onClick={onConfirm}
                        disabled={isLoading || !canDelete}
                        title={!canDelete ? 'Bitte den Namen exakt eintippen' : undefined}
                    >
                        Löschen
                    </button>
                </div>
            </div>
        </div>
    )
}

export default GlobalWidgetDeleteConfirmModal
