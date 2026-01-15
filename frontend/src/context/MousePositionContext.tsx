import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface MousePositionContextValue {
  position: MousePosition;
  isActive: boolean;
  isBlocked: boolean;
  addBlocker: () => void;
  removeBlocker: () => void;
}

const MousePositionContext = createContext<MousePositionContextValue | null>(null);

interface MousePositionProviderProps {
  children: ReactNode;
}

/**
 * Provider component that tracks global mouse position
 * Used by BackgroundGradient and Widget spotlight effects
 * Supports blocking mechanism for modals/overlays
 */
export function MousePositionProvider({ children }: MousePositionProviderProps) {
  const [position, setPosition] = useState<MousePosition>({ x: window.innerWidth / 2, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [blockerCount, setBlockerCount] = useState(0);

  const addBlocker = useCallback(() => {
    setBlockerCount(count => count + 1);
  }, []);

  const removeBlocker = useCallback(() => {
    setBlockerCount(count => Math.max(0, count - 1));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsActive(true);
    };

    const handleMouseLeave = () => {
      setIsActive(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <MousePositionContext.Provider
      value={{
        position,
        isActive,
        isBlocked: blockerCount > 0,
        addBlocker,
        removeBlocker,
      }}
    >
      {children}
    </MousePositionContext.Provider>
  );
}

/**
 * Hook to access global mouse position
 */
export function useMousePosition(): MousePositionContextValue {
  const context = useContext(MousePositionContext);
  if (!context) {
    throw new Error('useMousePosition must be used within a MousePositionProvider');
  }
  return context;
}

/**
 * Hook to block spotlight effects while a component is active
 * Automatically removes blocker on unmount
 *
 * @param isBlocking - Whether this component should block spotlight effects
 */
export function useBlockSpotlight(isBlocking: boolean): void {
  const { addBlocker, removeBlocker } = useMousePosition();

  useEffect(() => {
    if (isBlocking) {
      addBlocker();
      return () => removeBlocker();
    }
  }, [isBlocking, addBlocker, removeBlocker]);
}
