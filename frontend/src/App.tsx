import './colors.css'
import './App.css'
import './components/Header.css'
import './components/Dropdown.css'
import './components/Buttons.css'
import './components/Grid.css'
import { useState, useRef, useEffect } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import Widget from './components/Widget'
import {
  FolderIcon,
  CalendarIcon,
  GridIcon,
  SchoolIcon,
  ListIcon,
  NewsIcon,
  HelpIcon,
  SettingsIcon,
} from './components/icons'

function App() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [gridWidth, setGridWidth] = useState(1200)
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Sample user data
  const users = [
    { username: 'mmueller', fullName: 'Max Müller' },
    { username: 'sschmidt', fullName: 'Sarah Schmidt' },
    { username: 'jbecker', fullName: 'Jonas Becker' },
    { username: 'lweber', fullName: 'Lisa Weber' },
    { username: 'tmeyer', fullName: 'Thomas Meyer' },
    { username: 'kfischer', fullName: 'Kathrin Fischer' },
  ]

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

                    <div className="user-list">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.username}
                          className="user-item"
                          onClick={() => {
                            console.log('Selected user:', user.username)
                            setIsDropdownOpen(false)
                            setSearchQuery('')
                          }}
                        >
                          <div className="user-item-fullname">{user.fullName}</div>
                          <div className="user-item-username">{user.username}</div>
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <div className="no-users">Keine Benutzer gefunden</div>
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
  )
}

export default App
