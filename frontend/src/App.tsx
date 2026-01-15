import './colors.css'
import 'github-markdown-css/github-markdown.css'
import './App.css'
import './components/Header.css'
import './components/Dropdown.css'
import './components/Buttons.css'
import 'react-grid-layout/css/styles.css'
import './components/Grid.css'
import './components/StatusBanner.css'
import { useState, useRef, useEffect } from 'react'
import GridLayout, { type Layout } from 'react-grid-layout'
import Widget from './components/Widget'
import AddWidget from './components/AddWidget'
import LoginModal from './components/LoginModal'
import { UserDropdown } from './components/UserDropdown'
import {
  HelpIcon,
  SettingsIcon,
  WarningIcon,
  PlusIcon,
} from './components/icons'
import { getIcon } from './utils/iconMapping'
import { useInfiniteUsers } from './services/userService'
import { useDefaultWidgets, useUserWidgets, useHiddenUserWidgets, useBulkUpdateUserWidgets, useRemoveUserWidget, useAddUserWidget } from './services/widgetService'
import { getUserFullName } from './types/user'
import { MousePositionProvider } from './context/MousePositionContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { BackgroundGradient } from './components/BackgroundGradient'
import { useDebouncedCallback } from './hooks/useDebouncedCallback'
import { marked } from "marked";
import ConfirmDeleteModal from './components/ConfirmDeleteModal'
import type { User } from './types/user'
import type { Widget as WidgetType, UserWidget, UserWidgetUpdate } from './types/widget'
import WelcomeScreen from './components/WelcomeScreen'
import { getRandomWelcome } from './utils/welcomeMessages'

function AppContent() {
  const [gridWidth, setGridWidth] = useState(1200)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const [showHelp, setShowHelp] = useState(false);
  const helpContentRef = useRef<HTMLDivElement>(null);

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

  // Fetch hidden user widgets (for add widget modal)
  const {
    data: hiddenWidgets = [],
    isLoading: hiddenWidgetsLoading,
  } = useHiddenUserWidgets(authenticatedUser?.userId)

  // Determine which widgets to show
  const widgets = isAuthenticated && userWidgets.length > 0
    ? userWidgets.filter(w => w.visible) // Only show visible user widgets
    : defaultWidgets

  const widgetsLoading = isAuthenticated ? userWidgetsLoading : defaultWidgetsLoading
  const widgetsError = isAuthenticated ? userWidgetsError : defaultWidgetsError

  // Show banner if there's an error and it hasn't been dismissed
  const showErrorBanner = (usersError || widgetsError) && !isBannerDismissed

  // Mutation for saving widget positions
  const { mutate: saveWidgetPositions } = useBulkUpdateUserWidgets()

  // Mutation for removing widgets
  const { mutate: removeWidget } = useRemoveUserWidget()

  // Mutation for adding widgets
  const { mutate: addWidget } = useAddUserWidget()

  const loadHelp = async () => {
    const response = await fetch("/help.md");
    const mdText = await response.text();
    const html = await marked.parse(mdText);
    
    if (helpContentRef.current) {
      helpContentRef.current.innerHTML = html;
    }
  }

  const [deleteCandidate, setDeleteCandidate] = useState<{ widgetId: string; title: string } | null>(null)

  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null)

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
   * Generate grid layout based on widgets
   * For authenticated users: Use positions from backend config if available
   * For non-authenticated users: Arrange in 3-column grid
   * AddWidget only shown for authenticated users
   */
  const layout: Layout[] = [
    ...widgets.map((widget, index) => {
      // For user widgets, use saved position from config if available
      const userWidget = widget as UserWidget
      if (isAuthenticated && userWidget.config && 'x' in userWidget.config && 'y' in userWidget.config) {
        return {
          i: widget.widgetId,
          x: userWidget.config.x,
          y: userWidget.config.y,
          w: 1,
          h: 1,
        }
      }

      // Fallback: calculate position in 3-column grid
      return {
        i: widget.widgetId,
        x: index % 3,
        y: Math.floor(index / 3),
        w: 1,
        h: 1,
      }
    }),
    // Add widget only for authenticated users
    ...(isAuthenticated ? [{
      i: 'add-widget',
      x: widgets.length % 3,
      y: Math.floor(widgets.length / 3),
      w: 1,
      h: 1,
      static: true, // Prevent dragging the add widget button
    }] : []),
  ]

  /**
   * Handle layout changes (drag/drop)
   * Debounced to avoid excessive API calls during dragging
   */
  const handleLayoutChange = useDebouncedCallback((newLayout: Layout[]) => {
    // Only save if user is authenticated
    if (!isAuthenticated || !authenticatedUser) return

    // Filter out the add-widget element
    const widgetLayouts = newLayout.filter(item => item.i !== 'add-widget')

    // Create update payload for all visible widgets (userId is now in the path)
    const updates: UserWidgetUpdate[] = widgetLayouts.map(item => ({
      widgetId: item.i,
      config: {
        x: item.x,
        y: item.y,
      },
    }))

    // Save to backend
    if (updates.length > 0) {
      saveWidgetPositions({
        userId: authenticatedUser.userId,
        updates,
      })
    }
  }, 500)

  /**
   * Handle widget deletion (sets visible=false)
   */
  const handleDeleteWidget = (widgetId: string) => {
    if (!isAuthenticated || !authenticatedUser) return
    removeWidget({
      userId: authenticatedUser.userId,
      widgetId,
    })
  }

  /**
   * Handle adding a widget back (sets visible=true)
   */
  const handleAddWidget = (widgetId: string) => {
    if (!isAuthenticated || !authenticatedUser) return
    // Calculate position for the new widget (add at the end)
    const nextPosition = {
      x: widgets.length % 3,
      y: Math.floor(widgets.length / 3),
    }
    addWidget({
      userId: authenticatedUser.userId,
      widgetId,
      position: nextPosition,
    })
  }

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
            <button className="icon-button" aria-label="Hilfe" onClick={() => {loadHelp(); setShowHelp(!showHelp)}}>
              <HelpIcon />
            </button>
            <button className="icon-button" aria-label="Einstellungen">
              <SettingsIcon />
            </button>
          </div>
        </div>
      </header>
      <main className="main-content help-window" style={{ zIndex: showHelp ? 3 : 1}}>
        <div className="markdown-body" ref={helpContentRef}>
          
        </div>
      </main>
      <main className="main-content main-window" ref={mainContentRef}>
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
            isDraggable={isAuthenticated} // Only allow dragging for logged-in users
            isResizable={false}
            draggableHandle=".react-grid-drag-handle"
            onLayoutChange={handleLayoutChange}
          >
            {widgets.map((widget) => (
              <div key={widget.widgetId}>
                <Widget
                  title={widget.title}
                  color={widget.color}
                  target={widget.target}
                  icon={getIcon(widget.icon)}
                  showControls={isAuthenticated}
                  onDelete={() => setDeleteCandidate({ widgetId: widget.widgetId, title: widget.title })}
                />
              </div>
            ))}
            {isAuthenticated && (
              <div key="add-widget">
                <AddWidget
                  hiddenWidgets={hiddenWidgets}
                  onAddWidget={handleAddWidget}
                  isLoading={hiddenWidgetsLoading}
                />
              </div>
            )}
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
              const text = getRandomWelcome()
              setWelcomeMessage(`${text} ${selectedUser.firstName} ${selectedUser.lastName}!`)
            } else {
              setLoginError('Anmeldung fehlgeschlagen. Bitte Passwort überprüfen.')
            }
          }}
          error={loginError}
          isLoading={authLoading}
        />
      )}

    {deleteCandidate && (
        <ConfirmDeleteModal
            title={deleteCandidate.title}
            onClose={() => setDeleteCandidate(null)}
            onConfirm={() => {
                handleDeleteWidget(deleteCandidate.widgetId)
                setDeleteCandidate(null)
            }}
        />
    )}
    {welcomeMessage && (
        <WelcomeScreen
            message={welcomeMessage}
            onClose={() => setWelcomeMessage(null)}
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
