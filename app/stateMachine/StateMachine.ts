import { EventEmitter } from '@/event-emitter';
import type { ILogger, WithDebugOptions } from '@/utils';

import type { IStateMachine, StateMachineEventsMap } from './types/StateMachine.ts';
import { StateMachineEvents } from './types/StateMachine.ts';
import type { IStateMachineDefinition } from './types/StateMachineDefinition.ts';

export type BaseStateMachineInput<State, Action> = WithDebugOptions<{
  name?: string;
  definition: IStateMachineDefinition<State, Action>;
}>;

export class StateMachine<State, Action = State>
  extends EventEmitter<StateMachineEventsMap<State, Action>>
  implements IStateMachine<State, Action>
{
  protected logger?: ILogger;

  protected readonly name: string;

  protected readonly definition: IStateMachineDefinition<State, Action>;

  protected currentState: State;

  constructor(input: BaseStateMachineInput<State, Action>) {
    super();

    const { name = '', definition } = input;
    this.name = name;
    if (input.debug) {
      this.logger = input.logger;
    }
    this.definition = definition;

    this.currentState = definition.initialState;
  }

  public get state(): State {
    return this.currentState;
  }

  public isInState(state: State): state is State {
    return this.currentState === state;
  }

  public setState(next: State | Action): typeof this {
    const prevState = this.currentState;
    try {
      this.currentState = this.definition.getNextState(this.currentState, next);
      this.logger?.info(`${this.name} state changed ${String(prevState)} -> ${String(this.currentState)}`);
    } catch (setStateError) {
      this.logger?.error(
        `${this.name}:setState(.. Error occurred on (${String(prevState)} -> ${String(next)})`,
        setStateError,
      );
      return this;
    }

    try {
      this.emit(StateMachineEvents.stateChange, {
        type: 'stateChange',
        from: prevState,
        to: this.currentState,
        by: next,
      });
    } catch (error) {
      this.logger?.error(
        `${this.name}: Error occurred on (${String(prevState)} -> ${String(this.currentState)}) event emit`,
        error,
      );
    }
    return this;
  }
}
