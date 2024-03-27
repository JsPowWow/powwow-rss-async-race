import { EventEmitter } from '@/event-emitter';
import type { ILogger } from '@/utils';

import type { IStateMachine, StateMachineEventsMap } from './types/StateMachine.ts';

export type BaseStateMachineInput<State> = {
  name?: string;
  states: State[];
  initialState: State;
} & {
  debug: true;
  logger: ILogger;
};

export class BaseStateMachine<S> extends EventEmitter<StateMachineEventsMap<S>> implements IStateMachine<S> {
  protected logger?: ILogger;

  protected readonly name: string;

  protected readonly states: S[];

  protected currentState: S;

  constructor(input: BaseStateMachineInput<S>) {
    super();

    const { name = '', states, initialState, debug = false } = input;
    this.name = name;
    if (debug) {
      this.logger = input.logger;
    }

    this.states = states.concat();

    this.currentState = initialState;
  }

  public get state(): S {
    return this.currentState;
  }

  public isInState(state: S): boolean {
    return this.currentState === state;
  }

  protected setState(newState: S): boolean {
    // NOTE: it should dispatch the "StateMachineEvents.stateChange" event per available defined transition, i.e.
    // this.emit(StateMachineEvents.stateChange, { type: 'stateChange', from, to: newState });
    throw new Error(`${this.name} setState(${String(newState)}) method is not implemented`);
  }
}
