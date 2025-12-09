import { StateConfig } from './types';

// State 5 - Musecraft Editor (guided mode only, otherwise behaves like state 4)
export const state5Config: StateConfig = {
  header: {
    showWelcomeText: false,
    logoHeight: {
      mobile: "h-6",
      desktop: "md:h-7"
    },
    menuHeight: {
      mobile: "h-7",
      desktop: "md:h-8"
    },
    padding: {
      mobile: "py-0",
      desktop: "md:py-0"
    },
    horizontalPadding: {
      mobile: "px-0",
      desktop: "md:px-0"
    },
    transparentBackground: true,
    whiteIcons: true,
    collapsed: true
  },
  canvas: {
    clickable: true,
    nextState: 'state_6', // In free mode goes to final, in guided mode logic overrides to state_6
    previousState: 'state_4',
    fullscreen: true,
    roundedCorners: false,
    babylonCamera: {
      lowerRadiusLimit: {
        mobile: 4,
        desktop: 5
      },
      upperRadiusLimit: {
        mobile: 4,
        desktop: 5
      },
      beta: {
        mobile: Math.PI / 2.2,
        desktop: Math.PI / 2.2
      },
      alpha: {
        mobile: -Math.PI * 1.5,
        desktop: -Math.PI * 1.5
      },
      animationDuration: 1.5,
      animationDelay: 0
    },
    babylonScene: {
      logoEnabled: false,
      planetEnabled: false,
      rockRingEnabled: true,
      spaceshipEnabled: true,
      particlesEnabled: true,
      curveParticlesEnabled: true,
      portalsEnabled: true,
      cameraControlsEnabled: false,
      rootTransform: {
        mobile: { scale: 1.0, position: { x: 0, y: 0, z: 0 } },
        desktop: { scale: 1.0, position: { x: 0, y: 0, z: 0 } }
      },
      shipAnimation: {
        desktop: { position: { x: 0, y: -1, z: 0 } },
        mobile: { position: { x: 0, y: -1.3, z: 0 } },
        duration: .5,
        delay: 0
      },
      fogAnimation: {
        fogEnd: 105,
        duration: 2,
        delay: 0
      }
    }
  },
  content: {
    showOverlay: false,
    showTypingText: false,
    showCustomizeBox: false,
    customizeBoxVisible: false,
    showBottomLeftControls: true,
    whiteBottomLabel: true
  }
};

