import { StateConfig } from './types';

export const state2Config: StateConfig = {
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
    clickable: false,
    nextState: 'state_3',
    babylonCamera: {
      lowerRadiusLimit: {
        mobile: 21,
        desktop: 20
      },
      upperRadiusLimit: {
        mobile: 21,
        desktop: 20
      },
      beta: {
        mobile: Math.PI / 2,
        desktop: Math.PI / 2
      },
      alpha: {
        mobile: -Math.PI * 1.5,
        desktop: -Math.PI * 1.5
      },
      animationDuration: 0.8,
      animationDelay: 0
    },
    babylonScene: {
      logoEnabled: true,
      planetEnabled: true,
      rockRingEnabled: false,
      spaceshipEnabled: false,
      particlesEnabled: false,
      curveParticlesEnabled: false,
      portalsEnabled: false,
      materialAnimationDelay: 0.4, // Delay after camera radius change from state 3
      transformAnimationDelay: 0.4, // Delay after camera radius change from state 3
      rootTransform: {
        mobile: { scale: 0.135, position: { x: 0, y: 0, z: 17 } },
        desktop: { scale: 0.135, position: { x: .15, y: -0.05, z: 17 } }
      },
      shipAnimation: {
        position: { x: 0, y: -4, z: 20 }, // Ship behind camera
        duration: 2.0,
        delay: 0
      },
      fogAnimation: {
        fogEnd: 30,
        duration: 1.0,
        delay: 0
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
