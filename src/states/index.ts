import { S } from '../state';
import { StateConfig } from './types';
import { state0Config } from './state0';
import { state1Config } from './state1';
import { state2Config } from './state2';
import { state3Config } from './state3';
import { state4Config } from './state4';
import { state5Config } from './state5';

// Default config for states not yet defined
const defaultConfig: StateConfig = {
  header: {
    showWelcomeText: false,
    logoHeight: { mobile: "h-4", desktop: "md:h-5" },
    menuHeight: { mobile: "h-4", desktop: "md:h-5" },
    padding: { mobile: "py-3", desktop: "md:py-4" },
    horizontalPadding: { mobile: "px-6", desktop: "md:px-10" }
  },
  canvas: { clickable: false, nextState: null },
  content: { showOverlay: false, showTypingText: false, showCustomizeBox: false }
};

// State configuration mapping (now aligned with indices)
const stateConfigs: Record<S, StateConfig> = {
  [S.state_0]: state0Config, // State 0 = index 0
  [S.state_1]: state1Config, // State 1 = index 1
  [S.state_2]: state2Config, // State 2 = index 2
  [S.state_3]: state3Config, // State 3 = index 3
  [S.state_4]: state4Config, // State 4 = index 4
  [S.state_5]: state5Config,
  [S.state_6]: defaultConfig,
  [S.state_7]: defaultConfig,
  [S.state_8]: defaultConfig,
  [S.state_9]: defaultConfig,
};

export function getStateConfig(state: S): StateConfig {
  return stateConfigs[state] || state0Config; // Fallback to state 0
}

export * from './types';
