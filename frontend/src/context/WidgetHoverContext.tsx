import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { updateUser } from '../services/userService';

const STORAGE_KEY = 'dashboard-widget-color-bg';
const SAVE_DEBOUNCE_MS = 500;

function getLocalStorageWidgetColor(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
  } catch {
    // localStorage not available
  }
  return true; // default: enabled
}

function saveToLocalStorage(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // localStorage not available
  }
}

interface WidgetHoverContextValue {
  /** The color of the currently hovered widget, or null if no widget is hovered */
  hoveredColor: string | null;
  /** Set the hovered widget color (accepts value or functional update) */
  setHoveredColor: (color: string | null | ((prev: string | null) => string | null)) => void;
  /** Whether the background gradient adopts the hovered widget's color */
  widgetColorEnabled: boolean;
  /** Toggle/set the widget-color-on-background setting */
  setWidgetColorEnabled: (enabled: boolean) => void;
}

const WidgetHoverContext = createContext<WidgetHoverContextValue | null>(null);

interface WidgetHoverProviderProps {
  children: ReactNode;
}

/**
 * Provider component that tracks which widget is being hovered and stores
 * the user preference for whether hover colors appear on the background.
 */
export function WidgetHoverProvider({ children }: WidgetHoverProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [hoveredColor, setHoveredColorState] = useState<string | null>(null);
  const [widgetColorEnabled, setWidgetColorEnabledState] = useState<boolean>(getLocalStorageWidgetColor);
  const saveTimeoutRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  const setHoveredColor = useCallback((color: string | null | ((prev: string | null) => string | null)) => {
    setHoveredColorState(color);
  }, []);

  // Sync setting from user settings when logged in, reset to default on logout
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.settings?.widgetColorOnBackground !== undefined) {
        const value = user.settings.widgetColorOnBackground;
        setWidgetColorEnabledState(value);
        saveToLocalStorage(value);
      }
      // Mark as initialized even when the setting isn't in DB yet,
      // so the logout branch can fire and reset to default.
      isInitializedRef.current = true;
    } else if (isInitializedRef.current) {
      const defaultValue = true;
      setWidgetColorEnabledState(defaultValue);
      saveToLocalStorage(defaultValue);
      isInitializedRef.current = false;
    }
  }, [isAuthenticated, user?.settings?.widgetColorOnBackground]);

  // Save to backend (debounced)
  const saveToBackend = useCallback((enabled: boolean) => {
    if (!isAuthenticated || !user) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateUser(user.userId, {
          settings: { ...(user.settings || {}), widgetColorOnBackground: enabled },
        });
      } catch (error) {
        console.error('Failed to save widgetColorOnBackground setting:', error);
      }
    }, SAVE_DEBOUNCE_MS);
  }, [isAuthenticated, user]);

  const setWidgetColorEnabled = useCallback((enabled: boolean) => {
    setWidgetColorEnabledState(enabled);
    saveToLocalStorage(enabled);
    saveToBackend(enabled);
  }, [saveToBackend]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <WidgetHoverContext.Provider value={{ hoveredColor, setHoveredColor, widgetColorEnabled, setWidgetColorEnabled }}>
      {children}
    </WidgetHoverContext.Provider>
  );
}

/**
 * Hook to access widget hover state and the color-on-background setting
 */
export function useWidgetHover(): WidgetHoverContextValue {
  const context = useContext(WidgetHoverContext);
  if (!context) {
    throw new Error('useWidgetHover must be used within a WidgetHoverProvider');
  }
  return context;
}
