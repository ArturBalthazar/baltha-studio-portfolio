import { StateConfig } from './types';

export const state4Config: StateConfig = {
  header: {
    showWelcomeText: false,
    logoHeight: {
      mobile: "h-5",
      desktop: "md:h-7"
    },
    menuHeight: {
      mobile: "h-5",
      desktop: "md:h-7" 
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
    nextState: 'state_5',
    babylonCamera: {
      lowerRadiusLimit: {
        mobile: 4,
        desktop: 2
      },
      upperRadiusLimit: {
        mobile: 14,
        desktop: 7
      },
      animationDuration: 1.0, // Longer animation when zooming in
      animationDelay: 0 // Delay before starting zoom
    },
    babylonScene: {
      logoEnabled: false,
      planetEnabled: false,
      rockRingEnabled: true,
      spaceshipEnabled: true,
      particlesEnabled: true,
      portalsEnabled: false,
      rootTransform: {
        mobile: { scale: 1.0, position: { x: 0, y: 0, z: 0 } },
        desktop: { scale: 1.0, position: { x: 0, y: 0, z: 0 } }
      }
    }
  },
  content: {
    showOverlay: false,
    showTypingText: true,
    typingText: "or creating entire virtual worlds, we've got it covered! Ready to start?",
    showCustomizeBox: false,
    customizeBoxVisible: false
  }
};
