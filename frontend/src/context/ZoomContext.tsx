import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { updateUser } from '../services/userService'
import type { ZoomLevel } from '../types/user'

// Re-export ZoomLevel for convenience
export type { ZoomLevel } from '../types/user'

interface ZoomContextType {
  zoomLevel: ZoomLevel
  setZoomLevel: (level: ZoomLevel) => void
  zoomFactor: number
}

const ZOOM_FACTORS: Record<ZoomLevel, number> = {
  1: 0.8,
  2: 1.0,
  3: 1.25,
}

const STORAGE_KEY = 'dashboard-zoom-level'
const SAVE_DEBOUNCE_MS = 500

const ZoomContext = createContext<ZoomContextType | null>(null)

/**
 * Get zoom level from localStorage or default to 2 (100%)
 */
function getLocalStorageZoom(): ZoomLevel {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = parseInt(stored, 10)
      if (parsed >= 1 && parsed <= 3) {
        return parsed as ZoomLevel
      }
    }
  } catch {
    // localStorage not available
  }
  return 2
}

/**
 * Save zoom level to localStorage
 */
function saveToLocalStorage(level: ZoomLevel): void {
  try {
    localStorage.setItem(STORAGE_KEY, level.toString())
  } catch {
    // localStorage not available
  }
}

/**
 * Apply zoom factor as CSS custom property to document root
 */
function applyZoomFactor(factor: number): void {
  document.documentElement.style.setProperty('--zoom-factor', factor.toString())
}

/**
 * Validate and coerce a value to a valid ZoomLevel
 */
function toZoomLevel(value: unknown): ZoomLevel {
  if (typeof value === 'number' && value >= 1 && value <= 3) {
    return value as ZoomLevel
  }
  return 2
}

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [zoomLevel, setZoomLevelState] = useState<ZoomLevel>(getLocalStorageZoom)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  const zoomFactor = ZOOM_FACTORS[zoomLevel]

  // Apply zoom factor on mount and when it changes
  useEffect(() => {
    applyZoomFactor(zoomFactor)
  }, [zoomFactor])

  // Sync zoom from user settings when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.settings?.zoom !== undefined) {
      const userZoom = toZoomLevel(user.settings.zoom)
      setZoomLevelState(userZoom)
      saveToLocalStorage(userZoom)
      isInitializedRef.current = true
    } else if (!isAuthenticated) {
      // When logged out, keep using localStorage value (already set as initial state)
      isInitializedRef.current = false
    }
  }, [isAuthenticated, user?.settings?.zoom])

  // Save zoom to backend (debounced)
  const saveToBackend = useCallback((level: ZoomLevel) => {
    if (!isAuthenticated || !user) return

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce the save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateUser(user.userId, {
          settings: { ...(user.settings || {}), zoom: level }
        })
      } catch (error) {
        console.error('Failed to save zoom setting:', error)
      }
    }, SAVE_DEBOUNCE_MS)
  }, [isAuthenticated, user])

  const setZoomLevel = useCallback((level: ZoomLevel) => {
    setZoomLevelState(level)
    saveToLocalStorage(level)
    saveToBackend(level)
  }, [saveToBackend])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <ZoomContext.Provider value={{ zoomLevel, setZoomLevel, zoomFactor }}>
      {children}
    </ZoomContext.Provider>
  )
}

/**
 * Hook to access zoom context
 */
export function useZoom(): ZoomContextType {
  const context = useContext(ZoomContext)
  if (!context) {
    throw new Error('useZoom must be used within a ZoomProvider')
  }
  return context
}
