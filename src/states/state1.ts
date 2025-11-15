import { StateConfig } from './types';

export const state1Config: StateConfig = {
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
    nextState: 'state_2',
    babylonCamera: {
      lowerRadiusLimit: {
        mobile: 20,
        desktop: 16
      },
      upperRadiusLimit: {
        mobile: 20,
        desktop: 16
      },
      beta: {
        mobile: Math.PI / 2,
        desktop: Math.PI / 2
      },
      alpha: {
        mobile: -Math.PI * 1.5,
        desktop: -Math.PI * 1.5
      }
    },
    babylonScene: {
      logoEnabled: true,
      planetEnabled: false,
      rockRingEnabled: false,
      spaceshipEnabled: false,
      particlesEnabled: false,
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
    typingText: "Whether it's integrating tools into an existing web ecosystem, ",
    showCustomizeBox: false,
    customizeBoxVisible: false
  }
};
