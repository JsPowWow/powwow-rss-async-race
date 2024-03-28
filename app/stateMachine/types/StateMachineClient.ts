import type { Emitter } from '@/event-emitter';

import type { IState } from './State.ts';
import type { StateMachineEvent, StateMachineEventListener } from './StateMachine.ts';

export const enum StateMachineClientEvents {
  stateEnter = 'stateEnter',
  stateLeave = 'stateLeave',
  stateTransition = 'stateTransition',
  stateChange = 'stateChange',
}

export type StateMachineClientEventsMap<State> = {
  [Type in keyof typeof StateMachineClientEvents]: StateMachineEvent<Type, State>;
};

export type Unsubscribe = () => void;

export interface IStateMachineClient<State> extends Emitter<StateMachineClientEventsMap<State>> {
  readonly state: State;
  onStateEnter<Data>(
    state: State extends IState<Data> ? State['state'] : State,
    callBack: StateMachineEventListener<'stateEnter', State>,
  ): Unsubscribe;
  onStateLeave<Data>(
    state: State extends IState<Data> ? State['state'] : State,
    callBack: StateMachineEventListener<'stateLeave', State>,
  ): Unsubscribe;
  onStateTransition<Data>(
    from: State extends IState<Data> ? State['state'] : State,
    to: State extends IState<Data> ? State['state'] : State,
    callBack: StateMachineEventListener<'stateTransition', State>,
  ): Unsubscribe;
  onStateChange(callBack: StateMachineEventListener<'stateChange', State>): Unsubscribe;
}
