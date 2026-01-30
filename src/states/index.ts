import { S } from '../state';
import { StateConfig } from './types';
import { state0Config } from './state0';
import { state3Config } from './state3';
import { state4Config } from './state4';
import { state5Config } from './state5';
import { state6Config } from './state6';
import { state7Config } from './state7';
import { state8Config } from './state8';
import { stateFinalConfig } from './stateFinal';

// State configuration mapping (now aligned with indices)
const stateConfigs: Record<S, StateConfig> = {
  [S.state_0]: state0Config, // State 0 = Welcome
  [S.state_3]: state3Config, // State 3 = Mode selection
  [S.state_4]: state4Config, // State 4 = Meetkai
  [S.state_5]: state5Config, // State 5 = More Than Real
  [S.state_6]: state6Config, // State 6 = Baltha Maker
  [S.state_7]: state7Config, // State 7 = UFSC (Product Design)
  [S.state_8]: state8Config, // State 8 = Personal Projects
  [S.state_final]: stateFinalConfig, // Final state = Let's Connect
};

export function getStateConfig(state: S): StateConfig {
  return stateConfigs[state] || state0Config; // Fallback to state 0
}

export * from './types';

