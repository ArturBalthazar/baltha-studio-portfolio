import { StateConfig } from './types';

export const state3Config: StateConfig = {
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
    clickable: false,
    nextState: null,
    babylonCamera: {
      lowerRadiusLimit: {
        mobile: 44,
        desktop: 24
      },
      upperRadiusLimit: {
        mobile: 44,
        desktop: 24
      }
    },
    babylonScene: {
      logoEnabled: true,
      planetEnabled: true,
      rockRingEnabled: false,
      particlesEnabled: false,
      rootTransform: {
        mobile: { scale: 0.9, position: { x: 0, y: 0, z: 0 } },
        desktop: { scale: 0.9, position: { x: 1, y: -0.3, z: 0 } }
      }
    }
  },
  content: {
    showOverlay: false,
    showTypingText: true,
    typingText: "building custom web applications and data visualizations, ",
    showCustomizeBox: false,
    customizeBoxVisible: false
  }
};