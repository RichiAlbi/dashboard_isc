import { useMousePosition } from '../context/MousePositionContext';
import './BackgroundGradient.css';

interface BackgroundGradientProps {
  size?: number;
  colorStart?: string;
  colorEnd?: string;
  /** Damping factor: 0 = stays centered, 1 = follows cursor exactly */
  damping?: number;
}

/**
 * Dynamic background gradient that follows the mouse cursor
 * Uses inline styles to ensure the gradient updates on mouse move
 */
export function BackgroundGradient({
  size = 800,
  colorStart = 'var(--color-gradient-start)',
  colorEnd = 'var(--color-gradient-end)',
  damping = 0.3,
}: BackgroundGradientProps) {
  const { position } = useMousePosition();

  // Calculate center of viewport
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  // Interpolate between center and mouse position based on damping
  const dampedX = centerX + (position.x - centerX) * damping;
  const dampedY = centerY + (position.y - centerY) * damping;

  const gradientStyle = {
    background: `radial-gradient(
      ${size}px ${size}px at ${dampedX}px ${dampedY}px,
      ${colorStart} 0%,
      ${colorEnd} 100%
    )`,
  };

  return <div className="background-gradient" style={gradientStyle} />;
}
