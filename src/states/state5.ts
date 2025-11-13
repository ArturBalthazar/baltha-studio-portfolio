import { StateConfig } from './types';

export const state5Config: StateConfig = {
  header: {
    showWelcomeText: false,
    logoHeight: {
      mobile: "h-6",
      desktop: "md:h-7"
    },
    menuHeight: {
      mobile: "h-6",
      desktop: "md:h-7"
    },
    padding: {
      mobile: "py-0",
      desktop: "md:py-0"
    },
    horizontalPadding: {
      mobile: "px-0",
      desktop: "md:px-0"
    },
    transparentBackground: true, // No background in state 5
    whiteIcons: true, // White icons/logo
    collapsed: true // Collapse header to 0 height but keep icons visible
  },
  canvas: {
    clickable: true,
    nextState: 'state_6',
    fullscreen: true, // Full screen canvas
    roundedCorners: false, // No rounded corners in state 5
    babylonCamera: {
      lowerRadiusLimit: {
        mobile: 2,
        desktop: 2
      },
      upperRadiusLimit: {
        mobile: 5,
        desktop: 50
      }
    },
    babylonScene: {
      logoEnabled: false,
      planetEnabled: false,
      rockRingEnabled: true,
      spaceshipEnabled: true,
      particlesEnabled: true,
      portalsEnabled: true, // Show portals in state 5
      cameraControlsEnabled: false, // Will be dynamically toggled based on navigation mode
      rootTransform: {
        mobile: { scale: 1.0, position: { x: 0, y: 0, z: 0 } },
        desktop: { scale: 1.0, position: { x: 0, y: 0, z: 0 } }
      }
    }
  },
  content: {
    showOverlay: false,
    showTypingText: false,
    showCustomizeBox: false,
    customizeBoxVisible: false,
    showBottomLeftControls: true, // Show info, audio, nav buttons
    whiteBottomLabel: true // White "BALTHA STUDIO 2025" label
  }
};

