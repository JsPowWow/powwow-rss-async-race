import type { Emitter } from '@/event-emitter';

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
  onStateEnter(state: State, callBack: StateMachineEventListener<'stateEnter', State>): Unsubscribe;
  onStateLeave(state: State, callBack: StateMachineEventListener<'stateLeave', State>): Unsubscribe;
  onStateTransition(from: State, to: State, callBack: StateMachineEventListener<'stateTransition', State>): Unsubscribe;
  onStateChange(callBack: StateMachineEventListener<'stateChange', State>): Unsubscribe;
}
