import { StateConfig } from './types';

export const state4Config: StateConfig = {
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
    transparentBackground: true, // No background in state 4
    whiteIcons: true, // White icons/logo
    collapsed: true // Collapse header to 0 height but keep icons visible
  },
  canvas: {
    clickable: true,
    nextState: null,
    fullscreen: true, // Full screen canvas
    roundedCorners: false, // No rounded corners in state 4
    babylonCamera: {
      lowerRadiusLimit: {
        mobile: 2,
        desktop: 5
      },
      upperRadiusLimit: {
        mobile: 20,
        desktop: 50
      },
      beta: {
        mobile: Math.PI / 2.2,
        desktop: Math.PI / 2.2
      },
      alpha: {
        mobile: -Math.PI * 1.5,
        desktop: -Math.PI * 1.5
      },
      animationDuration: 1.0, // Duration for ALL camera properties (radius, beta, alpha)
      animationDelay: 0 // Delay before camera animation starts
    },
    babylonScene: {
      logoEnabled: false,
      planetEnabled: false,
      rockRingEnabled: true,
      spaceshipEnabled: true,
      particlesEnabled: true,
      curveParticlesEnabled: true, // Enable curve particles in state 4
      portalsEnabled: true, // Show portals in state 4
      cameraControlsEnabled: false, // Will be dynamically toggled based on navigation mode
      rootTransform: {
        mobile: { scale: 1.0, position: { x: 0, y: 0, z: 0 } },
        desktop: { scale: 1.0, position: { x: 0, y: 0, z: 0 } }
      },
      shipAnimation: {
        desktop: { position: { x: 0, y: -1, z: 0 } },
        mobile: { position: { x: 0, y: -1, z: 0 } },
        duration: 1,
        delay: 0
      },
      fogAnimation: {
        fogEnd: 400,
        duration: 0.6,
        delay: 0
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
