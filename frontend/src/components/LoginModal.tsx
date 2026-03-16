import React, { useEffect, useRef, useState } from 'react'
import { useBlockSpotlight } from '../context/MousePositionContext'
import './LoginModal.css'
import { CloseIcon } from './icons'

interface LoginModalProps {
  username: string
  fullName: string
  onClose: () => void
  onSubmit: (username: string, password: string) => void
  error?: string | null
  isLoading?: boolean
}

const LoginModal: React.FC<LoginModalProps> = ({ 
  username, 
  fullName,
  onClose, 
  onSubmit,
  error,
  isLoading = false
}) => {
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
    if (isLoading) return
    const usernameValue = usernameInputRef.current?.value || ''
    const passwordValue = passwordInputRef.current?.value || ''
    onSubmit(usernameValue, passwordValue)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
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
            disabled={isLoading}
          ><CloseIcon /></button>
        </div>
        <form className="login-modal-form" onSubmit={handleSubmit}>
          <div className="login-modal-fullname">
            {fullName}
          </div>
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
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="login-modal-error">
              {error}
            </div>
          )}
          <div className="login-modal-actions">
            <button 
              type="button" 
              className="login-modal-button secondary" 
              onClick={onClose}
              disabled={isLoading}
            >
              Abbrechen
            </button>
            <button 
              type="submit" 
              className="login-modal-button primary"
              disabled={isLoading}
            >
              {isLoading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginModal
