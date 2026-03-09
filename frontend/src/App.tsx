import './colors.css'
import './animations.css'
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
import SettingsModal from './components/SettingsModal'
import { UserDropdown } from './components/UserDropdown'
import {
  HelpIcon,
  SettingsIcon,
  WarningIcon,
  PlusIcon,
  HomeIcon,
  FullscreenIcon,
  FullscreenExitIcon,
} from './components/icons'
import { getIcon } from './utils/iconMapping'
import { useInfiniteUsers } from './services/userService'
import { useDefaultWidgets, useUserWidgets, useHiddenUserWidgets, useBulkUpdateUserWidgets, useRemoveUserWidget, useAddUserWidget, useResetUserWidgets } from './services/widgetService'
import { getUserFullName } from './types/user'
import { MousePositionProvider } from './context/MousePositionContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ZoomProvider } from './context/ZoomContext'
import { BackgroundGradient } from './components/BackgroundGradient'
import { useDebouncedCallback } from './hooks/useDebouncedCallback'
import { useGridLayoutManager } from './hooks/useGridLayoutManager'
import { indexToPosition } from './utils/gridLayoutUtils'
import ConfirmDeleteModal from './components/ConfirmDeleteModal'
import HelpModal from './components/HelpModal'
import type { User } from './types/user'
import type { Widget as WidgetType, UserWidget, UserWidgetUpdate } from './types/widget'
import WelcomeScreen from './components/WelcomeScreen'
import { getRandomWelcome } from './utils/welcomeMessages'
import { useInactivityLogout } from "./hooks/useInactivityLogout";
import AdminModal from './components/AdminModal.tsx'
import GlobalWidgetsModal from './components/GlobalWidgetsModal'
import UserAdminModal from './components/UserAdminModal'

function AppContent() {
  const [gridWidth, setGridWidth] = useState(1200)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const [embeddedUrl, setEmbeddedUrl] = useState<string | null>(null);
  const [embeddedTitle, setEmbeddedTitle] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showGlobalWidgets, setShowGlobalWidgets] = useState(false)

  const { user: authenticatedUser, isAuthenticated, login, logout, isLoading: authLoading } = useAuth()

  useInactivityLogout({
    enabled: isAuthenticated,
    timeoutMs: 20 * 60 * 1000,
    onTimeout: () => {
      logout()
      setSelectedUser(null)
      setLoginError(null)
      setWelcomeMessage("Sie wurdest nach 20 Minuten Inaktivität automatisch abgemeldet.")
    },
  })

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
  
  // Mutation for resetting widgets to default
  const { mutate: resetWidgets, isPending: isResettingWidgets } = useResetUserWidgets()

  /**
   * Open a URL in embedded view (iframe)
   * Falls back to new tab if iframe loading fails
   */
  const openEmbeddedPage = (url: string, title: string) => {
    setEmbeddedUrl(url);
    setEmbeddedTitle(title);
  }

  /**
   * Return to widget view
   */
  const closeEmbeddedPage = () => {
    setEmbeddedUrl(null);
    setEmbeddedTitle('');
  }

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  /**
   * Listen for fullscreen changes (e.g., user presses ESC)
   * Also enter fullscreen on initial load
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    // Enter fullscreen on initial load
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen request failed (e.g., user denied) - that's ok
      });
      setIsFullscreen(!!document.fullscreenElement);
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  /**
   * Open fallback popup window when iframe can't load the page
   */
  const openFallbackWindow = (url: string) => {
    const width = Math.min(1200, window.innerWidth * 0.8);
    const height = Math.min(800, window.innerHeight * 0.8);
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open(
      url,
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    closeEmbeddedPage();
  }

  /**
   * Handle iframe load - check if page was blocked by X-Frame-Options
   * This is difficult to detect reliably, so we just ensure iframe exists
   */
  const handleIframeLoad = () => {
    // onLoad fired successfully - in most cases this means the page loaded
    // X-Frame-Options blocking is hard to detect programmatically
    // Users can manually use the home button if content doesn't show
  }

  /**
   * Handle iframe error - fallback to popup window
   */
  const handleIframeError = () => {
    if (embeddedUrl) {
      openFallbackWindow(embeddedUrl);
    }
  }

  const [deleteCandidate, setDeleteCandidate] = useState<{ widgetId: string; title: string } | null>(null)
  const [helpMessage, showHelpMessage] = useState<{ title: string } | null>(null)

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
   * Grid layout manager hook
   * - Manages widget order (source of truth)
   * - Derives layout positions from order
   * - Handles drag-to-reorder with shift behavior
   * - Enforces maxRows based on widget count
   */
  const {
    layout,
    handleDragStart,
    handleDrag,
    handleDragStop,
    insertWidget,
    maxRows,
  } = useGridLayoutManager({
    widgets: widgets as UserWidget[],
    config: { cols: 3, rowHeight: 200 },
    gridWidth,
    onSave: (updates) => {
      if (authenticatedUser) {
        saveWidgetPositions({
          userId: authenticatedUser.userId,
          updates,
        })
      }
    },
    isAuthenticated,
  })

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

  const [showUserAdmin, setShowUserAdmin] = useState(false)

  /**
   * Handle adding a widget back (sets visible=true)
   */
  const handleAddWidget = (widgetId: string) => {
    if (!isAuthenticated || !authenticatedUser) return
    // Calculate position for the new widget (add at the end)
    const nextPosition = indexToPosition(widgets.length, 3)
    // Insert into grid layout manager order
    insertWidget(widgetId)
    // Persist to backend
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
            Es ist ein Fehler aufgetreten.
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
            {embeddedUrl && (
              <button className="icon-button" aria-label="Zurück zur Startseite" onClick={closeEmbeddedPage}>
                <HomeIcon />
              </button>
            )}
          </div>
          <div className="header-center">
            <h1 className="title">{embeddedUrl ? embeddedTitle : 'Dashboard'}</h1>
            <h2 className="subtitle">Industrieschule Chemnitz</h2>
          </div>
          <div className="header-right">
            <button className="icon-button" aria-label="Vollbildmodus" onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </button>
            <button className="icon-button" aria-label="Hilfe" onClick={() => {showHelpMessage({ title: "help" })}}>
              <HelpIcon />
            </button>
            <button className="icon-button" aria-label="Einstellungen" onClick={() => setShowSettings(true)}>
              <SettingsIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="main-content main-window" ref={mainContentRef}>
        {embeddedUrl ? (
          <div className="embedded-view">
            <iframe
              ref={iframeRef}
              src={embeddedUrl}
              title={embeddedTitle}
              className="embedded-iframe"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </div>
        ) : widgetsLoading ? (
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
            maxRows={maxRows}
            isDraggable={isAuthenticated}
            isResizable={false}
            draggableHandle=".react-grid-drag-handle"
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragStop={handleDragStop}
          >
            {widgets.map((widget) => (
              <div key={widget.widgetId}>
                <Widget
                  title={widget.title}
                  color={widget.color}
                  target={widget.target}
                  icon={getIcon(widget.icon ?? '')}
                  showControls={isAuthenticated}
                  onDelete={() => setDeleteCandidate({ widgetId: widget.widgetId, title: widget.title })}
                  onNavigate={openEmbeddedPage}
                  allow_iframe={widget.allow_iframe}
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
              setWelcomeMessage(`${text} ${selectedUser.firstName} ${selectedUser.lastName}.`)
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
    {helpMessage && (
      <HelpModal
        onClose={() => showHelpMessage(null)}
      />
    )}
    {welcomeMessage && (
        <WelcomeScreen
            message={welcomeMessage}
            onClose={() => setWelcomeMessage(null)}
        />
    )}
    {showSettings && (
        <SettingsModal
            onClose={() => setShowSettings(false)}
            isAuthenticated={isAuthenticated}
            onResetLayout={() => {
              if (!authenticatedUser) return
              // Combine visible and hidden widgets to get all user widgets
              const allUserWidgets = [...userWidgets, ...hiddenWidgets]
              resetWidgets({
                userId: authenticatedUser.userId,
                defaultWidgets,
                allUserWidgets,
                cols: 3,
              }, {
                onSuccess: () => setShowSettings(false)
              })
            }}
            isResetting={isResettingWidgets}
            onOpenAdmin={() => {
              setShowSettings(false)
              setShowAdmin(true)
            }}
        />
    )}
      {showAdmin && (
          <AdminModal
            onClose={() => setShowAdmin(false)}
            onManageGlobalWidgets={() => {
              setShowAdmin(false)
              setShowGlobalWidgets(true)
            }}
            onManageUsers={() => {
              setShowAdmin(false)
              setShowUserAdmin(true)
            }}
          />
      )}
      {showGlobalWidgets && (
          <GlobalWidgetsModal
            onClose={() => setShowGlobalWidgets(false)}
          />
      )}
      {showUserAdmin && (
          <UserAdminModal onClose={() => setShowUserAdmin(false)} />
      )}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <ZoomProvider>
        <MousePositionProvider>
          <BackgroundGradient />
          <AppContent />
        </MousePositionProvider>
      </ZoomProvider>
    </AuthProvider>
  )
}

export default App
