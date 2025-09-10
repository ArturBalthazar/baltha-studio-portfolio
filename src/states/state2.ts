import { StateConfig } from './types';

export const state2Config: StateConfig = {
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
    nextState: 'state3',
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
    typingText: "Whether it's integrating 3D tools into an existing ecosystem, ",
    showCustomizeBox: false,
    customizeBoxVisible: false
  }
};
