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
  particlesEnabled: boolean;
  portalsEnabled?: boolean; // Show portals in the scene
  cameraControlsEnabled?: boolean; // Enable camera controls (for free mode in state 5)
  rootTransform: ResponsiveBabylonTransform;
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
