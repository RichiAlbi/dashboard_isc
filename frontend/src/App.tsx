import './colors.css'
import './App.css'
import './components/Header.css'
import './components/Dropdown.css'
import './components/Buttons.css'
import 'react-grid-layout/css/styles.css'
import './components/Grid.css'
import './components/StatusBanner.css'
import { useState, useRef, useEffect } from 'react'
import GridLayout from 'react-grid-layout'
import Widget from './components/Widget'
import AddWidget from './components/AddWidget'
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
  PlusIcon,
} from './components/icons'
import { useInfiniteUsers } from './services/userService'
import { useDefaultWidgets, useUserWidgets } from './services/widgetService'
import { getUserFullName } from './types/user'
import { MousePositionProvider } from './context/MousePositionContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { BackgroundGradient } from './components/BackgroundGradient'
import type { User } from './types/user'
import type { Widget as WidgetType, UserWidget } from './types/widget'

/**
 * Icon mapping - currently disabled, keeping for future use
 * Uncomment when icons are needed again
 */
/*
const iconMap: Record<string, React.ReactNode> = {
  FolderIcon: <FolderIcon />,
  CalendarIcon: <CalendarIcon />,
  GridIcon: <GridIcon />,
  SchoolIcon: <SchoolIcon />,
  ListIcon: <ListIcon />,
  NewsIcon: <NewsIcon />,
}

function getIconComponent(iconName: string): React.ReactNode {
  return iconMap[iconName] || <GridIcon />
}
*/

function AppContent() {
  const [gridWidth, setGridWidth] = useState(1200)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Get auth state
  const { user: authenticatedUser, isAuthenticated, login, isLoading: authLoading } = useAuth()

  // Fetch users to check for connection errors (for banner display)
  const { error: usersError } = useInfiniteUsers('')

  // Fetch default widgets (for non-logged-in state)
  const { 
    data: defaultWidgets = [], 
    isLoading: defaultWidgetsLoading, 
    error: defaultWidgetsError 
  } = useDefaultWidgets()

  // Fetch user-specific widgets (for logged-in state)
  const { 
    data: userWidgets = [], 
    isLoading: userWidgetsLoading, 
    error: userWidgetsError 
  } = useUserWidgets(authenticatedUser?.userId)

  // Determine which widgets to show
  const widgets = isAuthenticated && userWidgets.length > 0 
    ? userWidgets.filter(w => w.visible) // Only show visible user widgets
    : defaultWidgets
  
  const widgetsLoading = isAuthenticated ? userWidgetsLoading : defaultWidgetsLoading
  const widgetsError = isAuthenticated ? userWidgetsError : defaultWidgetsError

  // Show banner if there's an error and it hasn't been dismissed
  const showErrorBanner = (usersError || widgetsError) && !isBannerDismissed

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

  /**
   * Generate grid layout dynamically based on widgets
   * Arranges widgets in a 3-column grid, with AddWidget always at the end
   */
  const layout = [
    ...widgets.map((widget, index) => ({
      i: widget.widgetId,
      x: index % 3, // Column (0, 1, 2, 0, 1, 2, ...)
      y: Math.floor(index / 3), // Row
      w: 1,
      h: 1,
    })),
    // Add widget always at the end
    {
      i: 'add-widget',
      x: widgets.length % 3,
      y: Math.floor(widgets.length / 3),
      w: 1,
      h: 1,
    },
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
            <UserDropdown onUserSelect={setSelectedUser} />
          </div>
          <div className="header-center">
            <h1 className="title">Dashboard</h1>
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
        {widgetsLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Widgets werden geladen...</p>
          </div>
        ) : (
          <GridLayout
            className="grid-layout"
            layout={layout}
            cols={3}
            rowHeight={200}
            width={gridWidth}
            isDraggable={true}
            isResizable={false}
            draggableHandle=".react-grid-drag-handle"
          >
            {widgets.map((widget) => (
              <div key={widget.widgetId}>
                <Widget
                  title={widget.title}
                  color={widget.color}
                  target={widget.target}
                />
              </div>
            ))}
            <div key="add-widget">
              <AddWidget />
            </div>
          </GridLayout>
        )}
      </main>
      </div>
      {selectedUser && (
        <LoginModal
          username={selectedUser.username}
          fullName={getUserFullName(selectedUser)}
          onClose={() => {
            setSelectedUser(null)
            setLoginError(null)
          }}
          onSubmit={async (username, password) => {
            setLoginError(null)
            const success = await login(selectedUser, password)
            if (success) {
              setSelectedUser(null)
            } else {
              setLoginError('Anmeldung fehlgeschlagen. Bitte Passwort überprüfen.')
            }
          }}
          error={loginError}
          isLoading={authLoading}
        />
      )}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <MousePositionProvider>
        <BackgroundGradient />
        <AppContent />
      </MousePositionProvider>
    </AuthProvider>
  )
}

export default App
