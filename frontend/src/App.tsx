import './colors.css'
import './App.css'
import './components/Header.css'
import './components/Dropdown.css'
import './components/Buttons.css'
import './components/Grid.css'
import './components/StatusBanner.css'
import { useState, useRef, useEffect } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import Widget from './components/Widget'
import LoginModal from './components/LoginModal'
import { UserDropdown } from './components/UserDropdown'
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
import { MousePositionProvider } from './context/MousePositionContext'
import { BackgroundGradient } from './components/BackgroundGradient'
import type { User } from './types/user'

function App() {
  const [gridWidth, setGridWidth] = useState(1200)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Fetch users to check for connection errors (for banner display)
  const { error: usersError } = useInfiniteUsers('')

  // Show banner if there's an error and it hasn't been dismissed
  const showErrorBanner = usersError && !isBannerDismissed

  // Update grid width based on container size
  useEffect(() => {
    const updateWidth = () => {
      if (mainContentRef.current) {
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
    <MousePositionProvider>
      <BackgroundGradient />
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
            <UserDropdown onUserSelect={setSelectedUser} />
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
    </MousePositionProvider>
  )
}

export default App
