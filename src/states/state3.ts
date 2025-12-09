import { StateConfig } from './types';

export const state3Config: StateConfig = {
  header: {
    showWelcomeText: false,
    logoHeight: {
      mobile: "h-5",
      desktop: "md:h-7"
    },
    menuHeight: {
      mobile: "h-6",
      desktop: "md:h-8" 
    },
    padding: {
      mobile: "py-3",
      desktop: "md:py-4" 
    },
    horizontalPadding: {
      mobile: "px-6",
      desktop: "md:px-10" 
    }
  },
  canvas: {
    clickable: true,
    nextState: 'state_4',
    previousState: 'state_0',
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
        mobile: Math.PI / 2,
        desktop: Math.PI / 2
      },
      alpha: {
        mobile: -Math.PI * 1.5,
        desktop: -Math.PI * 1.5
      },
      animationDuration: 2, // Longer animation when zooming in
      animationDelay: 0 // Delay before starting zoom
    },
    babylonScene: {
      logoEnabled: false,
      planetEnabled: false,
      rockRingEnabled: true,
      spaceshipEnabled: true,
      particlesEnabled: true,
      curveParticlesEnabled: false,
      portalsEnabled: false,
      rootTransform: {
        mobile: { scale: 1.0, position: { x: 0, y: 0, z: 0 } },
        desktop: { scale: 1.0, position: { x: 0, y: 0, z: 0 } }
      },
      shipAnimation: {
        position: { x: 0, y: -1.5, z: 0 },
        duration: 2.0,
        delay: 0
      },
      fogAnimation: {
        fogEnd: 65,
        duration: 2,
        delay: 0
      }
    }
  },
  content: {
    showOverlay: false,
    showTypingText: true,
    typingText: "Welcome to Baltha Studio! How would you like to explore our world?",
    showCustomizeBox: false,
    customizeBoxVisible: false
  }
};
