import { useState, useRef, useEffect } from 'react'
import { useBlockSpotlight } from '../context/MousePositionContext'
import { useInfiniteUsers } from '../services/userService'
import { getUserFullName } from '../types/user'
import { useDebounce } from '../hooks/useDebounce'
import type { User } from '../types/user'

interface UserDropdownProps {
  onUserSelect: (user: User) => void
}

export function UserDropdown({ onUserSelect }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const userListRef = useRef<HTMLDivElement>(null)

  // Block spotlight effect while dropdown is open
  useBlockSpotlight(isOpen)

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch users from API with infinite scrolling
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUsers(debouncedSearchQuery)

  // Flatten all pages into a single array of users
  const users = usersData?.pages.flatMap(page => page) ?? []

  // Handle scroll to load more users
  useEffect(() => {
    const userList = userListRef.current
    if (!userList) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = userList
      if (scrollHeight - scrollTop - clientHeight < 100) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }
    }

    userList.addEventListener('scroll', handleScroll)
    return () => userList.removeEventListener('scroll', handleScroll)
  }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleUserClick = (user: User) => {
    onUserSelect(user)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="user-dropdown-container">
      <button
        className="user-dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Benutzer auswählen</span>
        <svg
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
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

      {isOpen && (
        <>
          <div
            className="dropdown-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="user-dropdown-panel">
            <div className="dropdown-search-container">
              <input
                type="text"
                className="dropdown-search"
                placeholder="Benutzer suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="user-list" ref={userListRef}>
              {usersLoading && (
                <div className="no-users">Laden...</div>
              )}
              {usersError && (
                <div className="no-users">Fehler beim Laden der Benutzer</div>
              )}
              {!usersLoading && !usersError && users.map((user) => (
                <button
                  key={user.userId}
                  className="user-item"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="user-item-fullname">{getUserFullName(user)}</div>
                  <div className="user-item-username">{user.username}</div>
                </button>
              ))}
              {!usersLoading && !usersError && users.length === 0 && (
                <div className="no-users">Keine Benutzer gefunden</div>
              )}
              {isFetchingNextPage && (
                <div className="no-users">Weitere laden...</div>
              )}
            </div>

            <button
              className="logout-button"
              onClick={() => {
                console.log('Logout clicked')
                setIsOpen(false)
              }}
            >
              Abmelden
            </button>
          </div>
        </>
      )}
    </div>
  )
}
