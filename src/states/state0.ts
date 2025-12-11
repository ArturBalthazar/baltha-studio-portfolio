import { StateConfig } from './types';

export const state0Config: StateConfig = {
  header: {
    showWelcomeText: true,
    logoHeight: {
      mobile: "h-7",
      desktop: "md:h-9"
    },
    menuHeight: {
      mobile: "h-8",
      desktop: "md:h-9"
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
    nextState: 'state_3',
    previousState: null, // No previous state from state 0
    babylonCamera: {
      lowerRadiusLimit: {
        mobile: 20,
        desktop: 20
      },
      upperRadiusLimit: {
        mobile: 20,
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
      animationDuration: 0, // Duration for ALL camera properties (radius, beta, alpha)
      animationDelay: 0 // Delay before camera animation starts
    },
    babylonScene: {
      logoEnabled: true,
      planetEnabled: false,
      rockRingEnabled: false,
      spaceshipEnabled: false,
      particlesEnabled: false,
      curveParticlesEnabled: false,
      portalsEnabled: false,
      rockRingTrigger: true, // Trigger rockring fade-in here (stays for all future states)
      rootTransform: {
        mobile: { scale: .15, position: { x: 0, y: 0, z: 18 } },
        desktop: { scale: .15, position: { x: 0, y: 0, z: 18 } }
      },
      shipAnimation: {
        position: { x: 0, y: -4, z: 20 }, // Ship behind camera (not visible in state 0)
        duration: 0,
        delay: 0
      },
      fogAnimation: {
        fogEnd: 30, // Fog close (same as initial/state 3)
        duration: 1,
        delay: 0
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

