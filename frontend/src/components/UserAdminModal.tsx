import React, { useMemo, useState } from 'react'
import './UserAdminModal.css'
import { BackIcon } from './icons'
import { useBlockSpotlight } from '../context/MousePositionContext'
import { useInfiniteUsers, useUpdateUser } from '../services/userService'
import { useDebounce } from '../hooks/useDebounce'
import { getUserFullName } from '../types/user'
import type { User } from '../types/user'
import { useAuth } from '../context/AuthContext'

interface Props {
    onClose: () => void
    onBack?: () => void
}

const UserAdminModal: React.FC<Props> = ({ onClose, onBack }) => {
    useBlockSpotlight(true)

    const [search, setSearch] = useState('')
    const debounced = useDebounce(search, 300)

    const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteUsers(debounced)

    const users: User[] = useMemo(() => data?.pages.flatMap(p => p) ?? [], [data])

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const selected = useMemo(
        () => users.find(u => u.userId === selectedId) ?? null,
        [users, selectedId]
    )

    const updateMut = useUpdateUser()
    const [busyUserId, setBusyUserId] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)

    const { user: authenticatedUser } = useAuth()

    const isSelf = !!authenticatedUser && selected?.userId === authenticatedUser.userId
    const wouldRemoveAdminFromSelf = isSelf && !!selected?.isAdmin

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose()
    }

    const toggleAdmin = () => {
        if (!selected) return
        if (busyUserId) return
        if (wouldRemoveAdminFromSelf) return

        setBusyUserId(selected.userId)
        setActionError(null)

        updateMut.mutate(
            { userId: selected.userId, data: { isAdmin: !selected.isAdmin } },
            {
                onError: (err: any) => {
                    setActionError(err?.detail ?? err?.message ?? 'Update fehlgeschlagen.')
                },
                onSettled: () => setBusyUserId(null),
            }
        )
    }

    return (
        <div className="ua-overlay" onClick={handleOverlayClick}>
            <div className="ua-modal">
                <div className="ua-header">
                    {onBack && (
                        <button className="ua-back" onClick={onBack} aria-label="Zurück">
                            <BackIcon />
                        </button>
                    )}
                    <h2 className="ua-title">Nutzer verwalten</h2>
                    <button className="ua-close" onClick={onClose}>×</button>
                </div>

                <div className="ua-toolbar">
                    <input
                        className="ua-search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Suchen (Name, Kürzel)…"
                    />
                </div>

                <div className="ua-content">
                    <div className="ua-list">
                        {isLoading && <div className="ua-muted">Lade…</div>}
                        {error && <div className="ua-error">Fehler beim Laden.</div>}
                        {!isLoading && users.length === 0 && (
                            <div className="ua-muted">Keine Treffer.</div>
                        )}

                        {users.map(u => (
                            <button
                                key={u.userId}
                                className={`ua-item ${u.userId === selectedId ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedId(u.userId)
                                    setActionError(null)
                                }}
                            >
                                <div className="ua-item-title">{getUserFullName(u)}</div>
                                <div className="ua-item-sub">{u.username}</div>
                            </button>
                        ))}

                        {hasNextPage && (
                            <button
                                className="ua-loadmore"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                            >
                                {isFetchingNextPage ? 'Lade…' : 'Mehr laden'}
                            </button>
                        )}
                    </div>

                    <div className="ua-editor">
                        {!selected ? (
                            <div className="ua-muted ua-empty">
                                Bitte links einen Nutzer auswählen.
                            </div>
                        ) : (
                            <div className="ua-card">
                                <div className="ua-row">
                                    <div className="ua-k">Name</div>
                                    <div className="ua-v">{selected.firstName} {selected.lastName}</div>
                                </div>

                                <div className="ua-row">
                                    <div className="ua-k">Benutzername</div>
                                    <div className="ua-v">{selected.username}</div>
                                </div>

                                <div className="ua-row">
                                    <div className="ua-k">E-Mail</div>
                                    <div className="ua-v">{selected.email || '—'}</div>
                                </div>

                                <div className="ua-row">
                                    <div className="ua-k">Admin</div>
                                    <div className="ua-v">{selected.isAdmin ? 'Ja' : 'Nein'}</div>
                                </div>

                                <div className="ua-actions">
                                    <button
                                        className="settings-button secondary"
                                        onClick={() => {
                                            setSelectedId(null)
                                            setActionError(null)
                                        }}
                                        disabled={!!busyUserId}
                                    >
                                        Abbrechen
                                    </button>

                                    <button
                                        className={`settings-button ${selected.isAdmin ? 'danger' : ''}`}
                                        onClick={toggleAdmin}
                                        disabled={wouldRemoveAdminFromSelf || !!busyUserId}
                                        title={
                                            wouldRemoveAdminFromSelf
                                                ? 'Du kannst dir selbst keine Adminrechte entziehen'
                                                : undefined
                                        }
                                    >
                                        {busyUserId === selected.userId
                                            ? 'Speichere…'
                                            : selected.isAdmin
                                                ? 'Admin entfernen'
                                                : 'Admin hinzufügen'}
                                    </button>
                                </div>

                                {actionError && <div className="ua-error">{actionError}</div>}
                                {!actionError && wouldRemoveAdminFromSelf && (
                                    <div className="ua-error">
                                        Du kannst dir selbst keine Adminrechte entziehen.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserAdminModal
