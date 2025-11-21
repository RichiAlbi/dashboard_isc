import React, { useEffect, useRef } from 'react'
import { useBlockSpotlight } from '../context/MousePositionContext'
import './LoginModal.css'

interface LoginModalProps {
  username: string
  fullName: string
  onClose: () => void
  onSubmit: (username: string, password: string) => void
}

const LoginModal: React.FC<LoginModalProps> = ({ username, onClose, onSubmit }) => {
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const usernameInputRef = useRef<HTMLInputElement>(null)

  // Block spotlight effect while modal is open
  useBlockSpotlight(true)

  // Focus password input when modal opens
  useEffect(() => {
    passwordInputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const usernameValue = usernameInputRef.current?.value || ''
    const passwordValue = passwordInputRef.current?.value || ''
    onSubmit(usernameValue, passwordValue)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="login-modal-overlay" onClick={handleOverlayClick}>
      <div className="login-modal">
        <div className="login-modal-header">
          <h2 className="login-modal-title">Anmeldung</h2>
          <button
            className="login-modal-close"
            onClick={onClose}
            aria-label="Schließen"
          >
            ×
          </button>
        </div>
        <form className="login-modal-form" onSubmit={handleSubmit}>
          <div className="login-modal-field">
            <label htmlFor="username" className="login-modal-label">
              Benutzer
            </label>
            <input
              ref={usernameInputRef}
              type="text"
              id="username"
              className="login-modal-input"
              defaultValue={username}
              readOnly
            />
          </div>
          <div className="login-modal-field">
            <label htmlFor="password" className="login-modal-label">
              Passwort
            </label>
            <input
              ref={passwordInputRef}
              type="password"
              id="password"
              className="login-modal-input"
              autoComplete="current-password"
            />
          </div>
          <div className="login-modal-actions">
            <button type="button" className="login-modal-button secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="login-modal-button primary">
              Anmelden
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginModal
