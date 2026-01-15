import { useRef, useState, useEffect } from 'react';
import { useMousePosition } from '../context/MousePositionContext';

interface SpotlightPosition {
  x: number;
  y: number;
}

interface UseSpotlightReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isHovering: boolean;
  position: SpotlightPosition;
}

/**
 * Custom hook for spotlight effect on hover
 * Uses global mouse position context and calculates relative position
 *
 * @returns Object with ref, hover state, and relative position
 */
export function useSpotlight(): UseSpotlightReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const { position: globalPosition, isActive, isBlocked } = useMousePosition();
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState<SpotlightPosition>({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current || !isActive || isBlocked) {
      setIsHovering(false);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = globalPosition.x - rect.left;
    const relativeY = globalPosition.y - rect.top;

    // Check if mouse is within the element bounds
    const isInside =
      globalPosition.x >= rect.left &&
      globalPosition.x <= rect.right &&
      globalPosition.y >= rect.top &&
      globalPosition.y <= rect.bottom;

    setPosition({ x: relativeX, y: relativeY });
    setIsHovering(isInside);
  }, [globalPosition, isActive, isBlocked]);

  return {
    containerRef,
    isHovering,
    position,
  };
}
