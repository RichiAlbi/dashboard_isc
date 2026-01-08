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
import { useDefaultWidgets } from './services/widgetService'
import { getUserFullName } from './types/user'
import { MousePositionProvider } from './context/MousePositionContext'
import { BackgroundGradient } from './components/BackgroundGradient'
import type { User } from './types/user'
import type { Widget as WidgetType } from './types/widget'

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

function App() {
  const [gridWidth, setGridWidth] = useState(1200)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Fetch users to check for connection errors (for banner display)
  const { error: usersError } = useInfiniteUsers('')

  // Fetch default widgets from API
  const { data: widgets = [], isLoading: widgetsLoading, error: widgetsError } = useDefaultWidgets()

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
          >
            {widgets.map((widget) => (
              <div key={widget.widgetId}>
                <Widget
                  title={widget.title}
                  color={widget.color}
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
