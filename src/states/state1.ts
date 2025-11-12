import { StateConfig } from './types';

export const state1Config: StateConfig = {
  header: {
    showWelcomeText: true,
    logoHeight: {
      mobile: "h-6",
      desktop: "md:h-9"
    },
    menuHeight: {
      mobile: "h-6",
      desktop: "md:h-8"
    },
    padding: {
      mobile: "py-5",
      desktop: "md:py-6"
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
        mobile: 16,
        desktop: 10
      },
      upperRadiusLimit: {
        mobile: 16,
        desktop: 10
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
    showTypingText: false,
    showCustomizeBox: true, // Present but hidden (opacity 0)
    customizeBoxVisible: false
  }
};
