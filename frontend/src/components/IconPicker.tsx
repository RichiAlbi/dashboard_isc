import React, { useEffect, useMemo, useState } from 'react'
import './IconPicker.css'
import { ICON_KEYS, ICON_NAMES, getIcon, type IconKey } from '../utils/iconMapping'

type Props = {
    value: string | null | undefined
    onChange: (next: string) => void
    disabled?: boolean
}

const isIconKey = (v: string): v is IconKey =>
    (ICON_KEYS as readonly string[]).includes(v)

export const IconPicker: React.FC<Props> = ({ value, onChange, disabled }) => {
    const [open, setOpen] = useState(false)
    const [q, setQ] = useState('')

    const safeValue = typeof value === 'string' && isIconKey(value) ? value : ''
    const label = safeValue ? ICON_NAMES[safeValue as IconKey] : 'Kein Icon'

    const filteredKeys = useMemo(() => {
        const query = q.trim().toLowerCase()
        if (!query) return ICON_KEYS
        return ICON_KEYS.filter((k) =>
            k.toLowerCase().includes(query) ||
            ICON_NAMES[k].toLowerCase().includes(query)
        )
    }, [q])

    useEffect(() => {
        if (!open) return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open])

    const pick = (next: string) => {
        onChange(next)
        setOpen(false)
        setQ('')
    }

    return (
        <div className="icon-dropdown-container">
            <button
                type="button"
                className="icon-dropdown-button"
                onClick={() => setOpen((s) => !s)}
                disabled={disabled}
            >
        <span className="icon-dropdown-button-left">
          <span className="icon-dropdown-chip" aria-hidden="true">
            {safeValue ? getIcon(safeValue) : null}
          </span>
          <span className="icon-dropdown-label">{label}</span>
        </span>

                <svg
                    className={`icon-dropdown-arrow ${open ? 'open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {open && (
                <>
                    <div className="icon-dropdown-overlay" onClick={() => setOpen(false)} />

                    <div className="icon-dropdown-panel">
                        <div className="icon-dropdown-search-container">
                            <input
                                type="text"
                                className="icon-dropdown-search"
                                placeholder="Icon suchen..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="icon-list">
                            <button
                                type="button"
                                className={`icon-item ${safeValue === '' ? 'active' : ''}`}
                                onClick={() => pick('')}
                            >
                                <span className="icon-item-ico" aria-hidden="true" />
                                <div className="icon-item-text">Kein Icon</div>
                            </button>

                            {filteredKeys.map((k) => (
                                <button
                                    type="button"
                                    key={k}
                                    className={`icon-item ${safeValue === k ? 'active' : ''}`}
                                    onClick={() => pick(k)}
                                >
                  <span className="icon-item-ico" aria-hidden="true">
                    {getIcon(k)}
                  </span>
                                    <div className="icon-item-text">{ICON_NAMES[k]}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
