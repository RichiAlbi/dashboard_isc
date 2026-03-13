import React, { useEffect, useMemo, useState } from 'react'
import './GlobalWidgetsModal.css'
import { useBlockSpotlight } from '../context/MousePositionContext'
import {
    useWidgets,
    useBulkUpdateWidgets,
    useCreateWidget,
    useDeleteWidget,
} from '../services/widgetService'
import type { WidgetCreate, WidgetUpdate } from '../types/widget'
import GlobalWidgetDeleteConfirmModal from './GlobalWidgetDeleteConfirmModal'
import { IconPicker } from './IconPicker'
import { BackIcon } from './icons'

interface Props {
    onClose: () => void
    onBack?: () => void
}

const isHex = (v: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v.trim())

// Normalise any valid hex to the 6-digit form required by <input type="color">
const toColorInputHex = (v: string): string => {
    const s = v.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s
    if (/^#[0-9a-fA-F]{3}$/.test(s))
        return '#' + s[1].repeat(2) + s[2].repeat(2) + s[3].repeat(2)
    return '#33A3FF'
}

const GlobalWidgetsModal: React.FC<Props> = ({ onClose, onBack }) => {
    useBlockSpotlight(true)

    const [search, setSearch] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const { data: widgets = [], isLoading, error } = useWidgets({ limit: 100 })
    const updateMut = useBulkUpdateWidgets()
    const createMut = useCreateWidget()
    const deleteMut = useDeleteWidget()

    const [mode, setMode] = useState<'edit' | 'create'>('edit')
    const isBusy = updateMut.isPending || createMut.isPending || deleteMut.isPending

    const [deleteCandidate, setDeleteCandidate] = useState<{ widgetId: string; title: string } | null>(null)

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return widgets
        return widgets.filter(w =>
            w.title.toLowerCase().includes(q) ||
            w.target.toLowerCase().includes(q)
        )
    }, [widgets, search])

    const selected = useMemo(
        () => widgets.find(w => w.widgetId === selectedId) ?? null,
        [widgets, selectedId]
    )

    const [draft, setDraft] = useState<WidgetUpdate | null>(null)

    const [createDraft, setCreateDraft] = useState<WidgetCreate>({
        title: '',
        target: '',
        icon: '',
        color: '#33A3FF',
        default: false,
        allow_iframe: true,
    })

    // Edit-Draft füllen, wenn Auswahl wechselt
    useEffect(() => {
        if (!selected) {
            setDraft(null)
            return
        }
        setDraft({
            widgetId: selected.widgetId,
            title: selected.title,
            target: selected.target,
            icon: selected.icon ?? undefined,
            allow_iframe: selected.allow_iframe,
            color: selected.color,
            default: selected.default,
        })
    }, [selected])

    const hasChanges = useMemo(() => {
        if (!selected || !draft) return false
        return (
            (draft.title ?? '') !== selected.title ||
            (draft.target ?? '') !== selected.target ||
            (draft.icon ?? '') !== (selected.icon ?? '') ||
            (draft.color ?? '') !== selected.color ||
            (draft.allow_iframe ?? true) !== selected.allow_iframe ||
            (draft.default ?? false) !== selected.default
        )
    }, [selected, draft])

    const canSaveEdit = useMemo(() => {
        if (!draft) return false
        const title = (draft.title ?? '').trim()
        const target = (draft.target ?? '').trim()
        const color = (draft.color ?? '').trim()
        return title.length > 0 && target.length > 0 && isHex(color)
    }, [draft])

    const canSaveCreate = useMemo(() => {
        const title = (createDraft.title ?? '').trim()
        const target = (createDraft.target ?? '').trim()
        const color = (createDraft.color ?? '').trim()
        return title.length > 0 && target.length > 0 && isHex(color)
    }, [createDraft])

    const saveEdit = () => {
        if (!draft) return
        updateMut.mutate([{
            widgetId: draft.widgetId,
            title: (draft.title ?? '').trim(),
            target: (draft.target ?? '').trim(),
            icon: (draft.icon ?? '').trim() || undefined,
            color: (draft.color ?? '').trim(),
            allow_iframe: !!draft.allow_iframe,
            default: !!draft.default,
        }])
    }

    const saveCreate = () => {
        const title = (createDraft.title ?? '').trim()
        const target = (createDraft.target ?? '').trim()
        const color = (createDraft.color ?? '').trim()
        const icon = (createDraft.icon ?? '').trim()

        const payload: WidgetCreate = {
            title,
            target,
            color,
            default: !!createDraft.default,
            allow_iframe: !!createDraft.allow_iframe,
            ...(icon ? { icon } : {}), // nicht "" senden
        }

        createMut.mutate(payload, {
            onSuccess: (created) => {
                setCreateDraft({
                    title: '',
                    target: '',
                    icon: '',
                    color: '#33A3FF',
                    default: false,
                    allow_iframe: true,
                })
                setMode('edit')
                setSelectedId(created.widgetId)
            },
        })
    }

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose()
    }

    const confirmDelete = () => {
        if (!deleteCandidate) return

        deleteMut.mutate(deleteCandidate.widgetId, {
            onSuccess: () => {
                setDeleteCandidate(null)
                setSelectedId(null)
                setDraft(null)
                setMode('edit')
            },
        })
    }

    return (
        <div className="gw-overlay" onClick={handleOverlayClick}>
            <div className="gw-modal">
                <div className="gw-header">
                    {onBack && (
                        <button className="gw-back" onClick={onBack} aria-label="Zurück">
                            <BackIcon />
                        </button>
                    )}
                    <h2 className="gw-title">Globale Widgets verwalten</h2>
                    <button className="gw-close" onClick={onClose} aria-label="Schließen">×</button>
                </div>

                <div className="gw-toolbar">
                    <input
                        className="gw-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Suchen (Name/Link)…"
                    />
                </div>

                <div className="gw-content">
                    {/* LISTE */}
                    <div className="gw-list">
                        {isLoading && <div className="gw-muted">Lade…</div>}
                        {error && <div className="gw-error">Fehler beim Laden.</div>}
                        {!isLoading && !error && filtered.length === 0 && <div className="gw-muted">Keine Treffer.</div>}

                        {!isLoading && !error && filtered.map(w => (
                            <button
                                key={w.widgetId}
                                className={`gw-item ${w.widgetId === selectedId ? 'active' : ''}`}
                                onClick={() => {
                                    setMode('edit')
                                    setSelectedId(w.widgetId)
                                }}
                            >
                                <div className="gw-item-title">{w.title}</div>
                                <div className="gw-item-sub">{w.target}</div>
                            </button>
                        ))}

                        {!isLoading && !error && (
                            <button
                                className="gw-add"
                                onClick={() => {
                                    setSelectedId(null)
                                    setMode('create')
                                    setCreateDraft({
                                        title: '',
                                        target: '',
                                        icon: '',
                                        color: '#33A3FF',
                                        default: false,
                                        allow_iframe: true,
                                    })
                                }}
                            >
                                <span className="gw-add-icon" aria-hidden="true">+</span>
                                <span>Widget hinzufügen</span>
                            </button>
                        )}
                    </div>

                    {/* EDITOR */}
                    <div className="gw-editor">
                        {mode === 'create' ? (
                            <div className="gw-form">
                                <label className="gw-label">Name</label>
                                <input
                                    className="gw-input"
                                    value={createDraft.title ?? ''}
                                    onChange={(e) => setCreateDraft(s => ({ ...s, title: e.target.value }))}
                                />

                                <label className="gw-label">Link</label>
                                <input
                                    className="gw-input"
                                    value={createDraft.target ?? ''}
                                    onChange={(e) => setCreateDraft(s => ({ ...s, target: e.target.value }))}
                                />

                                <label className="gw-label">Logo</label>
                                <IconPicker
                                    value={createDraft.icon}
                                    onChange={(next) => setCreateDraft((s) => ({ ...s, icon: next }))}
                                    disabled={isBusy}
                                />

                                <label className="gw-label">Farbe</label>
                                <div className="gw-color-picker">
                                    <input
                                        type="color"
                                        className="gw-color-swatch"
                                        value={toColorInputHex(createDraft.color ?? '')}
                                        onChange={(e) => setCreateDraft(s => ({ ...s, color: e.target.value }))}
                                    />
                                    <input
                                        type="text"
                                        className="gw-color-hex"
                                        value={createDraft.color ?? ''}
                                        onChange={(e) => setCreateDraft(s => ({ ...s, color: e.target.value }))}
                                        placeholder="#33A3FF"
                                        maxLength={7}
                                        spellCheck={false}
                                    />
                                </div>
                                {!isHex(createDraft.color ?? '') && (
                                    <div className="gw-error">Hex-Code z.B. #33A3FF</div>
                                )}

                                <div className="gw-check">
                                    <label className="gw-toggle">
                                        <input
                                            type="checkbox"
                                            checked={!!createDraft.allow_iframe}
                                            onChange={(e) => setCreateDraft(s => ({ ...s, allow_iframe: e.target.checked }))}
                                        />
                                        <span className="gw-toggle-track">
                                            <span className="gw-toggle-thumb" />
                                        </span>
                                    </label>
                                    <span>Iframe erlauben</span>
                                    <span className="gw-tooltip">
                                        <span className="gw-info" aria-hidden="true">!</span>
                                        <span className="gw-tooltip-content" role="tooltip">
                                            Manche Websites lassen sich nicht in iFrames einbetten. Wenn dies der Fall ist, zeigt das Widget einen Fehler.
                                        </span>
                                    </span>
                                </div>

                                <div className="gw-check">
                                    <label className="gw-toggle">
                                        <input
                                            type="checkbox"
                                            checked={!!createDraft.default}
                                            onChange={(e) => setCreateDraft(s => ({ ...s, default: e.target.checked }))}
                                        />
                                        <span className="gw-toggle-track">
                                            <span className="gw-toggle-thumb" />
                                        </span>
                                    </label>
                                    <span>Default-Widget</span>
                                    <span className="gw-tooltip">
                                        <span className="gw-info" aria-hidden="true">!</span>
                                        <span className="gw-tooltip-content" role="tooltip">
                                            Default-Widgets werden automatisch bei Nutzern erstellt und wenn „Layout zurücksetzen" genutzt wird.
                                        </span>
                                    </span>
                                </div>

                                <div className="gw-actions">
                                    <button
                                        className="settings-button secondary"
                                        onClick={() => {
                                            setMode('edit')
                                            setSelectedId(null)
                                        }}
                                        disabled={isBusy}
                                    >
                                        Abbrechen
                                    </button>

                                    <button
                                        className="settings-button"
                                        onClick={saveCreate}
                                        disabled={!canSaveCreate || isBusy}
                                    >
                                        Hinzufügen
                                    </button>
                                </div>

                                {createMut.isPending && <div className="gw-muted">Erstelle…</div>}
                                {createMut.isError && <div className="gw-error">Fehler beim Erstellen.</div>}
                            </div>
                        ) : (
                            !selected || !draft ? (
                                <div className="gw-muted">Bitte wähle ein Widget aus, um es zu verwalten.</div>
                            ) : (
                                <div className="gw-form">
                                    <label className="gw-label">Name</label>
                                    <input
                                        className="gw-input"
                                        value={draft.title ?? ''}
                                        onChange={(e) => setDraft(s => s ? ({ ...s, title: e.target.value }) : s)}
                                    />

                                    <label className="gw-label">Link</label>
                                    <input
                                        className="gw-input"
                                        value={draft.target ?? ''}
                                        onChange={(e) => setDraft(s => s ? ({ ...s, target: e.target.value }) : s)}
                                    />

                                    <label className="gw-label">Logo</label>
                                    <IconPicker
                                        value={draft.icon}
                                        onChange={(next) => setDraft((s) => (s ? ({ ...s, icon: next }) : s))}
                                        disabled={isBusy}
                                    />

                                    <label className="gw-label">Farbe</label>
                                    <div className="gw-color-picker">
                                        <input
                                            type="color"
                                            className="gw-color-swatch"
                                            value={toColorInputHex(draft.color ?? '')}
                                            onChange={(e) => setDraft(s => s ? ({ ...s, color: e.target.value }) : s)}
                                        />
                                        <input
                                            type="text"
                                            className="gw-color-hex"
                                            value={draft.color ?? ''}
                                            onChange={(e) => setDraft(s => s ? ({ ...s, color: e.target.value }) : s)}
                                            placeholder="#33A3FF"
                                            maxLength={7}
                                            spellCheck={false}
                                        />
                                    </div>
                                    {!isHex(draft.color ?? '') && (
                                        <div className="gw-error">Hex-Code z.B. #33A3FF</div>
                                    )}

                                    <div className="gw-check">
                                        <label className="gw-toggle">
                                            <input
                                                type="checkbox"
                                                checked={draft.allow_iframe ?? true}
                                                onChange={(e) => setDraft(s => s ? ({ ...s, allow_iframe: e.target.checked }) : s)}
                                            />
                                            <span className="gw-toggle-track">
                                                <span className="gw-toggle-thumb" />
                                            </span>
                                        </label>
                                        <span>Iframe erlauben</span>
                                        <span className="gw-tooltip">
                                            <span className="gw-info" aria-hidden="true">!</span>
                                            <span className="gw-tooltip-content" role="tooltip">
                                                Manche Websites lassen sich nicht in iFrames einbetten. Wenn dies der Fall ist, zeigt das Widget einen Fehler.
                                            </span>
                                        </span>
                                    </div>

                                    <div className="gw-check">
                                        <label className="gw-toggle">
                                            <input
                                                type="checkbox"
                                                checked={!!draft.default}
                                                onChange={(e) => setDraft(s => s ? ({ ...s, default: e.target.checked }) : s)}
                                            />
                                            <span className="gw-toggle-track">
                                                <span className="gw-toggle-thumb" />
                                            </span>
                                        </label>
                                        <span>Default-Widget</span>
                                        <span className="gw-tooltip">
                                            <span className="gw-info" aria-hidden="true">!</span>
                                            <span className="gw-tooltip-content" role="tooltip">
                                                Default-Widgets werden automatisch bei Nutzern erstellt und wenn „Layout zurücksetzen" genutzt wird.
                                            </span>
                                        </span>
                                    </div>

                                    <div className="gw-actions">
                                        <button
                                            className="settings-button secondary"
                                            onClick={() => {
                                                setMode('edit')
                                                setSelectedId(null)
                                            }}
                                            disabled={isBusy}
                                        >
                                            Abbrechen
                                        </button>

                                        <button
                                            className="settings-button"
                                            onClick={saveEdit}
                                            disabled={!hasChanges || !canSaveEdit || isBusy}
                                        >
                                            Speichern
                                        </button>

                                        <button
                                            className="settings-button danger"
                                            onClick={() => setDeleteCandidate({ widgetId: selected.widgetId, title: selected.title })}
                                            disabled={isBusy}
                                        >
                                            Löschen
                                        </button>
                                    </div>

                                    {updateMut.isPending && <div className="gw-muted">Speichere…</div>}
                                    {updateMut.isError && <div className="gw-error">Fehler beim Speichern.</div>}
                                    {deleteMut.isError && <div className="gw-error">Fehler beim Löschen.</div>}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {deleteCandidate && (
                <GlobalWidgetDeleteConfirmModal
                    title={deleteCandidate.title}
                    onClose={() => setDeleteCandidate(null)}
                    onConfirm={confirmDelete}
                    isLoading={deleteMut.isPending}
                />
            )}
        </div>
    )
}

export default GlobalWidgetsModal
