import { StateMachine } from '@/state-machine';
import { getLogger } from '@/utils';

export const enum RaceState {
  initial = 'initial',
  ready = 'ready',
  error = 'error',
  started = 'started',
  finished = 'finished',
}

const raceSceneTransitions: Record<RaceState, Array<RaceState>> = {
  // from / to
  [RaceState.initial]: [RaceState.ready, RaceState.error],
  [RaceState.finished]: [RaceState.started, RaceState.ready],
  [RaceState.ready]: [RaceState.started, RaceState.ready],
  [RaceState.started]: [RaceState.ready, RaceState.finished],
  [RaceState.error]: [RaceState.ready],
};

export class RaceSceneStateMachine extends StateMachine<RaceState> {
  constructor() {
    super({
      name: 'raceState',
      definition: {
        initialState: RaceState.initial,
        getNextState: (currentState, nextState): RaceState => {
          if (raceSceneTransitions[currentState] && raceSceneTransitions[currentState].includes(nextState)) {
            return nextState;
          }
          throw new Error(`Transition (${String(currentState)} -> ${String(nextState)}) is not configured`);
        },
      },
      debug: true,
      logger: getLogger('raceState').setEnabled(true),
    });
  }
}
