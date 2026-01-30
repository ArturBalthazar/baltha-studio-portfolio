import React, { useRef, useEffect, useState, useCallback } from "react";
import cx from "classnames";
import { useUI, S } from "../state";
import { useI18n } from "../i18n";

interface Point {
  x: number;           // percentage (0-100)
  y: number;           // percentage (0-100)
  handleAngle?: number;    // Angle of the handle axis in degrees (0=right, 90=down, etc.)
  handleInLength?: number;  // Length of incoming handle (% of container)
  handleOutLength?: number; // Length of outgoing handle (% of container)
}

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Menu items configuration - using labelKey for translation lookup
interface MenuItem {
  id: string;
  labelKey: 'welcome' | 'musecraft' | 'meetkai' | 'morethanreal' | 'balthamaker' | 'ufsc' | 'letsConnect';
  label: string; // Hardcoded label for now (no translation)
  icon: string;
  pathPercent: number; // Position along the path (0-1)
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'welcome', labelKey: 'welcome', label: 'Welcome', icon: '/assets/images/baltha-outline.png', pathPercent: 0.0 },
  { id: 'musecraft', labelKey: 'musecraft', label: 'Musecraft', icon: '/assets/logos/musecraft-menu.png', pathPercent: 0.17 },
  { id: 'meetkai', labelKey: 'meetkai', label: 'MeetKai Inc', icon: '/assets/logos/meetkai-menu.png', pathPercent: 0.34 },
  { id: 'morethanreal', labelKey: 'morethanreal', label: 'More Than\nReal', icon: '/assets/logos/morethanreal-menu.png', pathPercent: 0.50 },
  { id: 'balthamaker', labelKey: 'balthamaker', label: 'Baltha Maker', icon: '/assets/logos/balthamaker-menu.png', pathPercent: 0.67 },
  { id: 'ufsc', labelKey: 'ufsc', label: 'UFSC', icon: '/assets/logos/ufsc-menu.png', pathPercent: 0.83 },
  { id: 'connect', labelKey: 'letsConnect', label: "Let's\nConnect!", icon: '/assets/images/connect.png', pathPercent: 1 },
];

// Desktop points - horizontal S-curve pattern (7 points)
// handleAngle: direction the OUT handle points (IN handle is opposite, +180°)
// Angle reference: 0=right, 90=down, 180=left, 270=up
const DESKTOP_POINTS: Point[] = [
  {
    x: 20, y: 35,
    handleAngle: 90,        // Axis points down/up
    handleOutLength: 15     // First point: only out handle
  },
  {
    x: 20, y: 50,
    handleAngle: 90,        // Axis at 45° diagonal
    handleInLength: 15,
    handleOutLength: 15
  },
  {
    x: 35, y: 50,
    handleAngle: -90,         // Horizontal axis
    handleInLength: 15,
    handleOutLength: 15
  },
  {
    x: 35, y: 35,
    handleAngle: -90,        // Vertical axis
    handleInLength: 15,
    handleOutLength: 15
  },
  {
    x: 50, y: 35,
    handleAngle: 90,       // Diagonal up-right axis
    handleInLength: 15,
    handleOutLength: 15
  },
  {
    x: 50, y: 65,
    handleAngle: 90,         // Horizontal axis
    handleInLength: 15,
    handleOutLength: 15
  },
  {
    x: 65, y: 65,
    handleAngle: -90,         // Horizontal axis
    handleInLength: 15,
    handleOutLength: 15
  },
  {
    x: 65, y: 45,
    handleAngle: -90,         // Horizontal axis
    handleInLength: 15,
    handleOutLength: 15
  },
  {
    x: 80, y: 45,
    handleAngle: 90,         // Horizontal axis
    handleInLength: 15,
    handleOutLength: 15
  },
  {
    x: 80, y: 60,
    handleAngle: 90,       // Points left (in comes from right)
    handleInLength: 15      // Last point: only in handle
  },
];

// Animation duration in seconds
const DRAW_DURATION = 1.5;

// Mobile points - vertical S-curve pattern (7 points)
const MOBILE_POINTS: Point[] = [
  // 1 — Top start
  {
    x: 40, y: 15,
    handleAngle: 0,      // Down
    handleOutLength: 15
  },

  // 2 — Slight right
  {
    x: 65, y: 15,
    handleAngle: 0,      // Down
    handleInLength: 15,
    handleOutLength: 15
  },

  // 3 — Back left
  {
    x: 65, y: 30,
    handleAngle: 180,      // Down
    handleInLength: 15,
    handleOutLength: 15
  },

  // 4 — Slight right again
  {
    x: 45, y: 30,
    handleAngle: 180,      // Down
    handleInLength: 15,
    handleOutLength: 15
  },

  // 5 — Centered middle bounce
  {
    x: 45, y: 45,
    handleAngle: 0,      // Down
    handleInLength: 15,
    handleOutLength: 15
  },

  // 6 — Bigger sweep to the right
  {
    x: 55, y: 45,
    handleAngle: 0,      // Down
    handleInLength: 15,
    handleOutLength: 15
  },

  // 7 — Bounce left again
  {
    x: 55, y: 60,
    handleAngle: 180,      // Down
    handleInLength: 15,
    handleOutLength: 15
  },

  // 8 — Stabilize in center
  {
    x: 30, y: 60,
    handleAngle: 180,      // Down
    handleInLength: 15,
    handleOutLength: 15
  },

  // 9 — Slight gentle right
  {
    x: 30, y: 75,
    handleAngle: 0,      // Down
    handleInLength: 15,
    handleOutLength: 15
  },

  // 10 — End point (bottom), no out handle
  {
    x: 70, y: 75,
    handleAngle: 0,      // Down
    handleInLength: 15
  }
];

/**
 * Converts percentage point to actual pixel coordinates
 */
function toPixels(point: { x: number; y: number }, width: number, height: number): { x: number; y: number } {
  return {
    x: (point.x / 100) * width,
    y: (point.y / 100) * height,
  };
}

/**
 * Gets the outgoing handle position for a point
 * handleAngle points in the OUT direction
 */
function getOutHandle(
  point: Point,
  width: number,
  height: number
): { x: number; y: number } {
  const pointPx = toPixels(point, width, height);

  if (point.handleAngle === undefined || point.handleOutLength === undefined) {
    return pointPx; // No handle, return point itself
  }

  const angleRad = (point.handleAngle * Math.PI) / 180;
  const avgSize = (width + height) / 2;
  const lengthPx = (point.handleOutLength / 100) * avgSize;

  return {
    x: pointPx.x + Math.cos(angleRad) * lengthPx,
    y: pointPx.y + Math.sin(angleRad) * lengthPx,
  };
}

/**
 * Gets the incoming handle position for a point
 * This is opposite direction of handleAngle (+180°)
 */
function getInHandle(
  point: Point,
  width: number,
  height: number
): { x: number; y: number } {
  const pointPx = toPixels(point, width, height);

  if (point.handleAngle === undefined || point.handleInLength === undefined) {
    return pointPx; // No handle, return point itself
  }

  // IN handle is opposite direction (+180°)
  const angleRad = ((point.handleAngle + 180) * Math.PI) / 180;
  const avgSize = (width + height) / 2;
  const lengthPx = (point.handleInLength / 100) * avgSize;

  return {
    x: pointPx.x + Math.cos(angleRad) * lengthPx,
    y: pointPx.y + Math.sin(angleRad) * lengthPx,
  };
}

/**
 * Generates an SVG path string from points with colinear bezier handles
 */
function generateSmoothPath(points: Point[], width: number, height: number): string {
  if (points.length < 2) return "";

  const pixelPoints = points.map((p) => toPixels(p, width, height));

  // Start path at first point
  let path = `M ${pixelPoints[0].x.toFixed(2)},${pixelPoints[0].y.toFixed(2)}`;

  // Generate cubic bezier curves between points
  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currentPoint = points[i];
    const currentPixel = pixelPoints[i];

    // Control point 1: outgoing handle of previous point
    const cp1 = getOutHandle(prevPoint, width, height);

    // Control point 2: incoming handle of current point  
    const cp2 = getInHandle(currentPoint, width, height);

    // C = cubic bezier: control1, control2, endpoint
    path += ` C ${cp1.x.toFixed(2)},${cp1.y.toFixed(2)} ${cp2.x.toFixed(2)},${cp2.y.toFixed(2)} ${currentPixel.x.toFixed(2)},${currentPixel.y.toFixed(2)}`;
  }

  return path;
}

// Bullet configuration
const BULLET_BASE_SIZE = 8;
const BULLET_EXPANDED_SIZE = 60;
const BULLET_BASE_BLUR = 1;
const BULLET_EXPANDED_BLUR = 20;
const BULLET_PROXIMITY_THRESHOLD = 90; // Distance to start expanding
const BULLET_LERP_SPEED = 0.12; // Smoothing factor (0-1, higher = faster)

/**
 * Find the closest point on path to a given position (optimized with refinement)
 */
function findClosestPointOnPath(
  pathElement: SVGPathElement,
  targetX: number,
  targetY: number,
  pathLength: number,
  cachedPoints: { x: number; y: number; length: number }[]
): { length: number; x: number; y: number } {
  let closestIdx = 0;
  let minDistSq = Infinity;

  // Use cached points for fast coarse lookup
  for (let i = 0; i < cachedPoints.length; i++) {
    const p = cachedPoints[i];
    const dx = p.x - targetX;
    const dy = p.y - targetY;
    const distSq = dx * dx + dy * dy;

    if (distSq < minDistSq) {
      minDistSq = distSq;
      closestIdx = i;
    }
  }

  // Refine between neighboring cached points
  const closest = cachedPoints[closestIdx];
  const prev = cachedPoints[Math.max(0, closestIdx - 1)];
  const next = cachedPoints[Math.min(cachedPoints.length - 1, closestIdx + 1)];

  // Check 5 points between prev and next for more accuracy
  let bestLength = closest.length;
  let bestX = closest.x;
  let bestY = closest.y;

  const startLen = prev.length;
  const endLen = next.length;

  for (let i = 0; i <= 5; i++) {
    const len = startLen + (i / 5) * (endLen - startLen);
    const pt = pathElement.getPointAtLength(len);
    const dx = pt.x - targetX;
    const dy = pt.y - targetY;
    const distSq = dx * dx + dy * dy;

    if (distSq < minDistSq) {
      minDistSq = distSq;
      bestLength = len;
      bestX = pt.x;
      bestY = pt.y;
    }
  }

  return { length: bestLength, x: bestX, y: bestY };
}

/**
 * Pre-calculate points along the path for fast lookup
 */
function cachePathPoints(
  pathElement: SVGPathElement,
  pathLength: number,
  samples: number = 150
): { x: number; y: number; length: number }[] {
  const points: { x: number; y: number; length: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const length = (i / samples) * pathLength;
    const point = pathElement.getPointAtLength(length);
    points.push({ x: point.x, y: point.y, length });
  }
  return points;
}

/**
 * Linear interpolation
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Check if device has touch capability (to hide bullet on touch devices)
 */
function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function NavigationMenu({ isOpen, onClose }: NavigationMenuProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathD, setPathD] = useState("");
  const [pathLength, setPathLength] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [pathReady, setPathReady] = useState(false);
  const [menuPositions, setMenuPositions] = useState<{ x: number; y: number }[]>([]);

  // Bullet state - using refs for performance (avoid re-renders)
  const bulletRef = useRef<HTMLDivElement>(null);
  const [showBullet, setShowBullet] = useState(false);
  const [curveAnimationDone, setCurveAnimationDone] = useState(false);
  const hasMouseRef = useRef(!isTouchDevice());
  const cachedPathPointsRef = useRef<{ x: number; y: number; length: number }[]>([]);
  const menuPositionsRef = useRef<{ x: number; y: number }[]>([]);
  const bulletCurrentPos = useRef({ x: 0, y: 0 });
  const bulletTargetPos = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const isAnimatingBullet = useRef(false);

  // Handle open/close with animation timing
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setPathReady(false);
      setIsAnimating(false);
      setCurveAnimationDone(false);
      // Reset dimensions to force recalculation
      setDimensions({ width: 0, height: 0 });
      setPathD("");
      setPathLength(0);
    } else {
      setIsAnimating(false);
      setCurveAnimationDone(false);
      // Wait for close animation before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        setPathReady(false);
        setPathD("");
        setPathLength(0);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Update dimensions on resize or when shouldRender changes
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
        setIsMobile(rect.width < 768); // md breakpoint
      }
    }
  }, []);

  useEffect(() => {
    if (!shouldRender) return;

    // Use delays to ensure container is rendered
    // Mobile browsers may need more time
    const timer1 = setTimeout(updateDimensions, 20);
    const timer2 = setTimeout(updateDimensions, 100); // Fallback for slower devices
    const timer3 = setTimeout(updateDimensions, 200); // Extra fallback for mobile

    // Use ResizeObserver to detect container size changes (e.g., when state changes)
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateDimensions);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener("resize", updateDimensions);
      resizeObserver?.disconnect();
    };
  }, [shouldRender, updateDimensions]);

  // Generate path when dimensions change
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    if (!isOpen) return;

    const points = isMobile ? MOBILE_POINTS : DESKTOP_POINTS;
    const newPath = generateSmoothPath(points, dimensions.width, dimensions.height);
    setPathD(newPath);
  }, [dimensions, isMobile, isOpen]);

  // Calculate path length after path updates, then trigger animation
  useEffect(() => {
    if (!pathRef.current || !pathD || !isOpen) return;

    // Calculate path length
    const length = pathRef.current.getTotalLength();
    if (length === 0) return;

    setPathLength(length);

    // Calculate menu item positions along the path
    const positions = MENU_ITEMS.map(item => {
      const point = pathRef.current!.getPointAtLength(item.pathPercent * length);
      return { x: point.x, y: point.y };
    });
    setMenuPositions(positions);
    menuPositionsRef.current = positions; // Cache for bullet proximity calc

    // Cache path points for fast bullet lookup
    cachedPathPointsRef.current = cachePathPoints(pathRef.current, length, 80);

    // If already animating (resize during open menu), just update without re-animating
    if (isAnimating) {
      // Path is already visible, no need to animate again
      return;
    }

    // Mark path as ready (renders with full dashoffset)
    setPathReady(true);

    // Start animation after a delay to ensure initial dashoffset is rendered
    // Mobile browsers need more time to apply the initial state
    const timer = setTimeout(() => {
      if (isOpen) {
        setIsAnimating(true);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pathD, isOpen, isAnimating]);

  // Set curveAnimationDone after the draw animation completes
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setCurveAnimationDone(true);
      }, DRAW_DURATION * 1000);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Calculate proximity scale for bullet (inline for performance)
  const getProximityScale = (bulletX: number, bulletY: number): number => {
    const positions = menuPositionsRef.current;
    if (positions.length === 0) return 1;

    let minDistSq = Infinity;
    for (const pos of positions) {
      const dx = pos.x - bulletX;
      const dy = pos.y - bulletY;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) minDistSq = distSq;
    }

    const minDist = Math.sqrt(minDistSq);
    if (minDist > BULLET_PROXIMITY_THRESHOLD) return 1;
    const t = 1 - (minDist / BULLET_PROXIMITY_THRESHOLD);
    return 1 + t * ((BULLET_EXPANDED_SIZE / BULLET_BASE_SIZE) - 1);
  };

  // Update bullet DOM with current position
  const updateBulletDOM = useCallback((x: number, y: number) => {
    if (!bulletRef.current) return;

    const scale = getProximityScale(x, y);
    const size = BULLET_BASE_SIZE * scale;
    const blur = BULLET_BASE_BLUR + (scale - 1) * ((BULLET_EXPANDED_BLUR - BULLET_BASE_BLUR) / ((BULLET_EXPANDED_SIZE / BULLET_BASE_SIZE) - 1));

    const bullet = bulletRef.current;
    const inner = bullet.firstElementChild as HTMLElement;

    // Position the container - use transform to center it precisely on the path point
    bullet.style.left = `${x}px`;
    bullet.style.top = `${y}px`;
    bullet.style.width = `${size}px`;
    bullet.style.height = `${size}px`;
    bullet.style.transform = 'translate(-50%, -50%)'; // Ensure centering is maintained

    // Apply blur to inner element only
    if (inner) {
      inner.style.filter = `blur(${blur}px)`;
    }
  }, []);

  // Smooth animation loop for bullet
  const animateBullet = useCallback(() => {
    const current = bulletCurrentPos.current;
    const target = bulletTargetPos.current;

    // Lerp toward target
    const newX = lerp(current.x, target.x, BULLET_LERP_SPEED);
    const newY = lerp(current.y, target.y, BULLET_LERP_SPEED);

    // Check if we're close enough to stop
    const dx = target.x - newX;
    const dy = target.y - newY;
    const distSq = dx * dx + dy * dy;

    if (distSq > 0.5) {
      // Still moving
      current.x = newX;
      current.y = newY;
      updateBulletDOM(newX, newY);
      animationFrameRef.current = requestAnimationFrame(animateBullet);
    } else {
      // Close enough, snap to target
      current.x = target.x;
      current.y = target.y;
      updateBulletDOM(target.x, target.y);
      isAnimatingBullet.current = false;
    }
  }, [updateBulletDOM]);

  // Start bullet animation if not already running
  const startBulletAnimation = useCallback(() => {
    if (!isAnimatingBullet.current) {
      isAnimatingBullet.current = true;
      animationFrameRef.current = requestAnimationFrame(animateBullet);
    }
  }, [animateBullet]);

  // Mouse move handler
  useEffect(() => {
    if (!isAnimating || pathLength === 0 || !hasMouseRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !pathRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Find closest point using cached points + refinement
      const closest = findClosestPointOnPath(
        pathRef.current,
        mouseX,
        mouseY,
        pathLength,
        cachedPathPointsRef.current
      );

      // Update target position
      bulletTargetPos.current = { x: closest.x, y: closest.y };

      // Initialize position on first show
      if (!showBullet) {
        bulletCurrentPos.current = { x: closest.x, y: closest.y };
        updateBulletDOM(closest.x, closest.y);
        setShowBullet(true);
      }

      // Start smooth animation
      startBulletAnimation();
    };

    const handleMouseLeave = () => {
      setShowBullet(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        isAnimatingBullet.current = false;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove, { passive: true });
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, pathLength, showBullet, startBulletAnimation, updateBulletDOM]);

  // Reset bullet when menu closes
  useEffect(() => {
    if (!isOpen) {
      setShowBullet(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        isAnimatingBullet.current = false;
      }
    }
  }, [isOpen]);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!shouldRender) return null;

  // Radial gradient size
  const gradientSize = isMobile ? 180 : 270;

  return (
    <div
      ref={containerRef}
      className={cx(
        "absolute inset-0 z-40 overflow-hidden",
        "transition-opacity duration-500",
        isAnimating ? "opacity-100" : "opacity-0"
      )}
      onClick={handleBackdropClick}
    >
      {/* Dark overlay - z-0 */}
      <div
        className={cx(
          "absolute inset-0 bg-brand-dark/90 z-0",
          "transition-opacity duration-500",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
      />

      {/* SVG Path - z-10 */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ overflow: "visible" }}
      >
        {/* Path with draw animation */}
        <path
          ref={pathRef}
          d={pathD}
          stroke="white"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: pathLength || 1,
            strokeDashoffset: pathReady ? (isAnimating ? 0 : pathLength) : pathLength || 1,
            transition: isAnimating ? `stroke-dashoffset ${DRAW_DURATION}s cubic-bezier(0.4, 0, 0.2, 1)` : 'none',
          }}
        />
      </svg>

      {/* Radial gradient circles behind buttons - z-15 */}
      {menuPositions.map((pos, index) => {
        const item = MENU_ITEMS[index];
        return (
          <div
            key={`gradient-${item.id}`}
            className="absolute z-[15] pointer-events-none"
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: gradientSize,
                height: gradientSize,
                background: `radial-gradient(circle, rgba(8, 21, 41, .9) 0%, rgba(8, 21, 41, .9) 30%, rgba(8, 21, 41, 0) 70%)`,
                opacity: isAnimating ? 1 : 0,
                transition: `opacity 0.4s ease-out`,
                transitionDelay: `${index * 0.06}s`,
              }}
            />
          </div>
        );
      })}

      {/* Bullet that follows the path - z-17 (between gradients and buttons) */}
      {hasMouseRef.current && (
        <div
          ref={bulletRef}
          className="absolute z-[17] pointer-events-none"
          style={{
            transform: 'translate(-50%, -50%)',
            width: BULLET_BASE_SIZE,
            height: BULLET_BASE_SIZE,
            opacity: showBullet ? 0.9 : 0,
            transition: 'opacity 0.15s ease-out',
          }}
        >
          {/* Inner glow element - keeps centered regardless of blur */}
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(
                from 0deg,
                #9A92D2,
                #7583ff,
                #FF8800,
                #FF99CC,
                #9A92D2
              )`,
              animation: 'rotateGlow 3s linear infinite',
            }}
          />
        </div>
      )}

      {/* Mobile current state indicator - expanded bullet at current state's position */}
      {isMobile && curveAnimationDone && (() => {
        const currentState = useUI.getState().state;
        // Map states to menu item indices
        const stateToMenuIndex: Record<number, number> = {
          [S.state_0]: 0,      // Welcome
          [S.state_3]: 0,      // Mode selection - still maps to Welcome
          [S.state_4]: 1,      // Musecraft (Personal Project)
          [S.state_5]: 2,      // MeetKai
          [S.state_6]: 3,      // More Than Real
          [S.state_7]: 4,      // Baltha Maker
          [S.state_8]: 5,      // UFSC (Product Design)
          [S.state_final]: 6,  // Connect
        };
        const menuIndex = stateToMenuIndex[currentState];
        const pos = menuPositions[menuIndex];
        if (!pos) return null;

        return (
          <div
            className="absolute z-[18] pointer-events-none"
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
              width: BULLET_EXPANDED_SIZE,
              height: BULLET_EXPANDED_SIZE,
              opacity: 0.9,
              filter: `blur(${BULLET_EXPANDED_BLUR}px)`,
              transition: 'all 0.4s ease-out',
            }}
          >
            <div
              className="w-full h-full rounded-full transition-all duration-300"
              style={{
                background: `conic-gradient(
                  from 0deg,
                  #9A92D2,
                  #7583ff,
                  #FF8800,
                  #FF99CC,
                  #9A92D2
                )`,
                animation: 'rotateGlow 3s linear infinite',
              }}
            />
          </div>
        );
      })()}

      {/* Menu item buttons - z-20 (on top of bullet) */}
      {menuPositions.map((pos, index) => {
        const item = MENU_ITEMS[index];
        return (
          <button
            key={item.id}
            className={cx(
              "absolute z-20 flex flex-col items-center justify-center",
              "cursor-pointer transition-all duration-300",
              "hover:scale-110 active:scale-95",
              "pointer-events-auto"
            )}
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
              opacity: isAnimating ? 1 : 0,
              transition: `opacity 0.4s ease-out, transform 0.3s ease-out`,
              transitionDelay: `${0.4 + index * 0.08}s`,
            }}
            onClick={(e) => {
              e.stopPropagation();

              // Map menu items to states
              const stateMap: Record<string, S> = {
                'welcome': S.state_0,            // Welcome
                'musecraft': S.state_4,          // Musecraft (Personal Project)
                'meetkai': S.state_5,            // MeetKai
                'morethanreal': S.state_6,       // More Than Real
                'balthamaker': S.state_7,        // Baltha Maker
                'ufsc': S.state_8,               // UFSC (Product Design)
                'connect': S.state_final,        // Connect
              };

              const targetState = stateMap[item.id];
              const currentState = useUI.getState().state;

              // If in state_final and clicking Welcome, reload the page
              if (currentState === S.state_final && item.id === 'welcome') {
                onClose();
                window.location.reload();
                return;
              }

              if (targetState !== undefined) {
                // First, switch to guided mode if currently in free mode
                const currentMode = useUI.getState().navigationMode;
                if (currentMode === 'free') {
                  useUI.getState().setNavigationMode('guided');
                }

                // Then navigate to the target state
                useUI.getState().setState(targetState);

                // Close the menu
                onClose();
              }
            }}
          >
            <img
              src={item.icon}
              alt={item.label}
              className={cx(
                "select-none mb-2",
                // Size: Baltha Maker is 1.5x bigger
                item.id === 'balthamaker'
                  ? (isMobile ? "w-16 h-16" : "w-24 h-24")
                  : (isMobile ? "w-12 h-12" : "w-16 h-16")
              )}
              draggable={false}
            />
            <span
              className={cx(
                "text-white font-mono text-center whitespace-pre-line leading-tight select-none",
                isMobile ? "text-sm" : "text-base"
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

