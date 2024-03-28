import type { Emitter } from '@/event-emitter';

export type StateMachineEvent<Type, State> = {
  type: Type;
} & StateMachineEventData<State>;

export type StateMachineEventData<State> = {
  from: State;
  to: State;
};

export const enum StateMachineEvents {
  stateChange = 'stateChange',
}

export type StateMachineEventsMap<State> = {
  [Type in keyof typeof StateMachineEvents]: StateMachineEvent<Type, State>;
};

export type StateMachineEventListener<Type, State> = (event: StateMachineEvent<Type, State>) => void;

export interface IStateMachine<State> extends Emitter<StateMachineEventsMap<State>> {
  get state(): State;
  isInState(state: State): state is State;
}
