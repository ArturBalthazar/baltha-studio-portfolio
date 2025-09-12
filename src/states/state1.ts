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
        mobile: 54,
        desktop: 32
      },
      upperRadiusLimit: {
        mobile: 54,
        desktop: 32
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
