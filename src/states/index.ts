import { S } from '../state';
import { StateConfig } from './types';
import { state0Config } from './state0';
import { state1Config } from './state1';
import { state2Config } from './state2';
import { state3Config } from './state3';
import { state4Config } from './state4';
import { state5Config } from './state5';
import { state6Config } from './state6';
import { state7Config } from './state7';
import { stateFinalConfig } from './stateFinal';

// State configuration mapping (now aligned with indices)
const stateConfigs: Record<S, StateConfig> = {
  [S.state_0]: state0Config, // State 0 = Welcome
  [S.state_1]: state1Config, // State 1 = Logo selector
  [S.state_2]: state2Config, // State 2 = Globe/continent
  [S.state_3]: state3Config, // State 3 = Mode selection
  [S.state_4]: state4Config, // State 4 = Car Customizer (or free explore)
  [S.state_5]: state5Config, // State 5 = Musecraft Editor (guided mode only)
  [S.state_6]: state6Config, // State 6 = Digital Dioramas (guided mode only)
  [S.state_7]: state7Config, // State 7 = Petwheels (guided mode only)
  [S.state_final]: stateFinalConfig, // Final state = Let's Connect
};

export function getStateConfig(state: S): StateConfig {
  return stateConfigs[state] || state0Config; // Fallback to state 0
}

export * from './types';
