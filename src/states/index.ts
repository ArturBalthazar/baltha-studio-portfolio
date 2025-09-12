import { S } from '../state';
import { StateConfig } from './types';
import { state1Config } from './state1';
import { state2Config } from './state2';
import { state3Config } from './state3';
import { state4Config } from './state4';

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

// State configuration mapping
const stateConfigs: Record<S, StateConfig> = {
  [S.state_1]: state1Config,
  [S.state_2]: state2Config,
  [S.state_3]: state3Config,
  [S.state_4]: state4Config,
  [S.state_5]: defaultConfig,
  [S.state_6]: defaultConfig,
  [S.state_7]: defaultConfig,
  [S.state_8]: defaultConfig,
  [S.state_9]: defaultConfig,
  [S.state_10]: defaultConfig,
};

export function getStateConfig(state: S): StateConfig {
  return stateConfigs[state] || state1Config; // Fallback to state 1
}

export * from './types';
