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
        mobile: 32,
        desktop: 18
      },
      upperRadiusLimit: {
        mobile: 32,
        desktop: 18
      }
    }
  },
  content: {
    showOverlay: false,
    showTypingText: true,
    typingText: "building custom 3D applications and data visualizations, ",
    showCustomizeBox: false,
    customizeBoxVisible: false
  }
};