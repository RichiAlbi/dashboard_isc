import './colors.css'
import './App.css'
import './components/Header.css'
import './components/Dropdown.css'
import './components/Buttons.css'
import './components/Grid.css'
import './components/StatusBanner.css'
import { useState, useRef, useEffect, useMemo } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import Widget from './components/Widget'
import LoginModal from './components/LoginModal'
import {
  FolderIcon,
  CalendarIcon,
  GridIcon,
  SchoolIcon,
  ListIcon,
  NewsIcon,
  HelpIcon,
  SettingsIcon,
  WarningIcon,
} from './components/icons'
import { useInfiniteUsers } from './services/userService'
import { getUserFullName } from './types/user'
import { useDebounce } from './hooks/useDebounce'
import type { User } from './types/user'

function App() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [gridWidth, setGridWidth] = useState(1200)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const userListRef = useRef<HTMLDivElement>(null)

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
  const users = useMemo(() => {
    return usersData?.pages.flatMap(page => page) ?? []
  }, [usersData])

  // Show banner if there's an error and it hasn't been dismissed
  const showErrorBanner = usersError && !isBannerDismissed

  // Update grid width based on container size
  useEffect(() => {
    const updateWidth = () => {
      if (mainContentRef.current) {
        // Dynamically calculate horizontal padding from computed styles
        const computedStyle = window.getComputedStyle(mainContentRef.current)
        const paddingLeft = parseFloat(computedStyle.paddingLeft)
        const paddingRight = parseFloat(computedStyle.paddingRight)
        const horizontalPadding = paddingLeft + paddingRight
        setGridWidth(mainContentRef.current.clientWidth - horizontalPadding)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Handle scroll to load more users
  useEffect(() => {
    const userList = userListRef.current
    if (!userList) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = userList
      // Load more when user scrolls to within 100px of the bottom
      if (scrollHeight - scrollTop - clientHeight < 100) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }
    }

    userList.addEventListener('scroll', handleScroll)
    return () => userList.removeEventListener('scroll', handleScroll)
  }, [isDropdownOpen, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Widget data
  const widgets = [
    { id: 'home', title: 'Home', icon: <FolderIcon />, color: '#3b82f6' },
    { id: 'stundenplan', title: 'Stundenplan', icon: <CalendarIcon />, color: '#10b981' },
    { id: 'raumplansystem', title: 'Raumplansystem', icon: <GridIcon />, color: '#8b5cf6' },
    { id: 'schulportal', title: 'Schulportal Sachsen', icon: <SchoolIcon />, color: '#f59e0b' },
    { id: 'vertretungsplan', title: 'Vertretungsplan', icon: <ListIcon />, color: '#ef4444' },
    { id: 'newsfeed', title: 'Newsfeed', icon: <NewsIcon />, color: '#06b6d4' }
  ]

  // Grid layout configuration
  const layout = [
    { i: 'home', x: 0, y: 0, w: 1, h: 1 },
    { i: 'stundenplan', x: 1, y: 0, w: 1, h: 1 },
    { i: 'raumplansystem', x: 2, y: 0, w: 1, h: 1 },
    { i: 'schulportal', x: 0, y: 1, w: 1, h: 1 },
    { i: 'vertretungsplan', x: 1, y: 1, w: 1, h: 1 },
    { i: 'newsfeed', x: 2, y: 1, w: 1, h: 2 }
  ]

  return (
    <>
      {showErrorBanner && (
        <div className="status-banner error">
          <div className="status-banner-icon">
            <WarningIcon />
          </div>
          <div className="status-banner-message">
            Datenbank nicht erreichbar. Die Anwendung läuft im Offline-Modus.
          </div>
          <button
            className="status-banner-close"
            onClick={() => setIsBannerDismissed(true)}
            aria-label="Schließen"
          >
            ×
          </button>
        </div>
      )}
      <div className="app-container">
        <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="user-dropdown-container">
              <button
                className="user-dropdown-button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>Benutzer auswählen</span>
                <svg
                  className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
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

              {isDropdownOpen && (
                <>
                  <div
                    className="dropdown-overlay"
                    onClick={() => setIsDropdownOpen(false)}
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
                          onClick={() => {
                            setSelectedUser(user)
                            setIsDropdownOpen(false)
                            setSearchQuery('')
                          }}
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
                        setIsDropdownOpen(false)
                      }}
                    >
                      Abmelden
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="header-center">
            <h1 className="title">Verwaltungstafel</h1>
            <h2 className="subtitle">Industrieschule Chemnitz</h2>
          </div>
          <div className="header-right">
            <button className="icon-button" aria-label="Hilfe">
              <HelpIcon />
            </button>
            <button className="icon-button" aria-label="Einstellungen">
              <SettingsIcon />
            </button>
          </div>
        </div>
      </header>
      <main className="main-content" ref={mainContentRef}>
        <GridLayout
          className="grid-layout"
          layout={layout}
          cols={3}
          rowHeight={200}
          width={gridWidth}
          isDraggable={true}
          isResizable={false}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <Widget title={widget.title} icon={widget.icon} color={widget.color} />
            </div>
          ))}
        </GridLayout>
      </main>
      </div>
      {selectedUser && (
        <LoginModal
          username={selectedUser.username}
          fullName={getUserFullName(selectedUser)}
          onClose={() => setSelectedUser(null)}
          onSubmit={(username, password) => {
            // TODO: Implement login logic
            console.log('Login attempt:', username, password)
          }}
        />
      )}
    </>
  )
}

export default App
