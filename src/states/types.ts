export interface ResponsiveSize {
  mobile: string;
  desktop: string;
}

export interface HeaderConfig {
  showWelcomeText: boolean;
  logoHeight: ResponsiveSize;
  menuHeight: ResponsiveSize;
  padding: ResponsiveSize;
  horizontalPadding: ResponsiveSize;
  transparentBackground?: boolean; // For state 5 - no background
  whiteIcons?: boolean; // For state 5 - white colored icons/text
  collapsed?: boolean; // For state 5 - collapse header to 0 height but keep icons visible
}

export interface BabylonCameraConfig {
  lowerRadiusLimit: {
    mobile: number;
    desktop: number;
  };
  upperRadiusLimit: {
    mobile: number;
    desktop: number;
  };
  beta?: {
    mobile: number;
    desktop: number;
  };
  alpha?: {
    mobile: number;
    desktop: number;
  };
  animationDuration?: number; // Duration of camera animation in seconds
  animationDelay?: number; // Delay before camera animation in seconds
}

export interface ShipAnimationConfig {
  position?: {
    x: number;
    y: number;
    z: number;
  };
  // Responsive position (overrides position if provided)
  mobile?: {
    position: { x: number; y: number; z: number };
  };
  desktop?: {
    position: { x: number; y: number; z: number };
  };
  duration?: number; // Duration of ship position animation in seconds
  delay?: number; // Delay before ship position animation in seconds
}

export interface FogAnimationConfig {
  fogStart?: number;
  fogEnd?: number;
  duration?: number; // Duration of fog animation in seconds
  delay?: number; // Delay before fog animation in seconds
}

export interface BabylonTransform {
  position?: { x: number; y: number; z: number };
  scale?: number;
}

export interface ResponsiveBabylonTransform {
  mobile: BabylonTransform;
  desktop: BabylonTransform;
}

export interface BabylonSceneConfig {
  logoEnabled: boolean;
  planetEnabled: boolean;
  rockRingEnabled: boolean;
  spaceshipEnabled: boolean;
  particlesEnabled: boolean;
  portalsEnabled?: boolean; // Show portals in the scene
  cameraControlsEnabled?: boolean; // Enable camera controls (for free mode in state 5)
  rootTransform: ResponsiveBabylonTransform;
  materialAnimationDelay?: number; // Delay before material animations in seconds
  transformAnimationDelay?: number; // Delay before transform animations in seconds
  shipAnimation?: ShipAnimationConfig; // Ship position animation config
  fogAnimation?: FogAnimationConfig; // Fog animation config
}

export interface CanvasConfig {
  clickable: boolean;
  nextState: string | null;
  babylonCamera?: BabylonCameraConfig;
  babylonScene?: BabylonSceneConfig;
  fullscreen?: boolean; // For state 5 - expand to 100% width and height
  roundedCorners?: boolean; // Whether to show rounded corners (default: true)
}

export interface OverlayButton {
  icon: string;
  label: string;
  selected?: boolean;
}

export interface OverlayBoxDimensions {
  width: {
    mobile: string;
    desktop: string;
  };
  maxWidth?: {
    mobile: string;
    desktop: string;
  };
  minWidth?: {
    mobile: string;
    desktop: string;
  };
  height: {
    mobile: string;
    desktop: string;
  };
  maxHeight?: {
    mobile: string;
    desktop: string;
  };
  minHeight?: {
    mobile: string;
    desktop: string;
  };
  transform: {
    mobile: string;
    desktop: string;
  };
}

export interface TitleLayout {
  position: 'center' | 'top-left';
  showLiveSignal?: boolean;
  showWindowControls?: boolean;
  buttonLayout: 'bottom-center' | 'left-grid';
  buttonGridRows?: number;
  buttonGridCols?: number;
}

export interface StateContentVisibility {
  state2: {
    title: boolean;
    buttons: boolean;
  };
  state3: {
    title: boolean;
    liveSignal: boolean;
    windowControls: boolean;
    buttons: boolean;
  };
  state4: {
    title: boolean;
    buttons: boolean;
  };
}

export interface OverlayContent {
  title: string;
  description: string;
  buttons: OverlayButton[];
  titleLayout?: TitleLayout;
}

export interface ContentConfig {
  showOverlay: boolean;
  showTypingText?: boolean;
  typingText?: string;
  showCustomizeBox?: boolean;
  customizeBoxVisible?: boolean;
  overlayContent?: OverlayContent;
  overlayBoxDimensions?: OverlayBoxDimensions;
  showBottomLeftControls?: boolean; // For state 5 - info, audio, navigation buttons
  whiteBottomLabel?: boolean; // For state 5 - white "BALTHA STUDIO 2025" label
}

export interface StateConfig {
  header: HeaderConfig;
  canvas: CanvasConfig;
  content: ContentConfig;
}
