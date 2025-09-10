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

export interface CanvasConfig {
  clickable: boolean;
  nextState: string | null;
  babylonCamera?: BabylonCameraConfig;
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
  maxWidth: {
    mobile: string;
    desktop: string;
  };
  minWidth: {
    mobile: string;
    desktop: string;
  };
  height: {
    mobile: string;
    desktop: string;
  };
  maxHeight: {
    mobile: string;
    desktop: string;
  };
  minHeight: {
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
}

export interface StateConfig {
  header: HeaderConfig;
  canvas: CanvasConfig;
  content: ContentConfig;
}
