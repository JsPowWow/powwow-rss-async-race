import { EventEmitter } from '@/event-emitter';
import type { ILogger, WithDebugOptions } from '@/utils';

import type { IStateMachine, StateMachineEventsMap } from './types/StateMachine.ts';
import { StateMachineEvents } from './types/StateMachine.ts';
import type { IStateMachineDefinition } from './types/StateMachineDefinition.ts';

export type BaseStateMachineInput<State> = WithDebugOptions<{
  name?: string;
  definition: IStateMachineDefinition<State>;
}>;

export class StateMachine<S> extends EventEmitter<StateMachineEventsMap<S>> implements IStateMachine<S> {
  protected logger?: ILogger;

  protected readonly name: string;

  protected readonly definition: IStateMachineDefinition<S>;

  protected currentState: S;

  constructor(input: BaseStateMachineInput<S>) {
    super();

    const { name = '', definition } = input;
    this.name = name;
    if (input.debug) {
      this.logger = input.logger;
    }
    this.definition = definition;

    this.currentState = definition.initialState;
  }

  public get state(): S {
    return this.currentState;
  }

  public isInState(state: S): state is S {
    return this.currentState === state;
  }

  public setState(newState: S): typeof this {
    const prevState = this.currentState;
    try {
      this.currentState = this.definition.getNextState(this.currentState, newState);
      this.logger?.info(`${this.name} state changed ${String(prevState)} -> ${String(this.currentState)}`);
    } catch (setStateError) {
      this.logger?.error(
        `${this.name}:setState(.. Error occurred on (${String(prevState)} -> ${String(newState)})`,
        setStateError,
      );
      return this;
    }

    try {
      this.emit(StateMachineEvents.stateChange, { type: 'stateChange', from: prevState, to: this.currentState });
    } catch (error) {
      this.logger?.error(
        `${this.name}: Error occurred on (${String(prevState)} -> ${String(this.currentState)}) event emit`,
        error,
      );
    }
    return this;
  }
}
