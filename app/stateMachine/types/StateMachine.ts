import type { Emitter } from '@/event-emitter';

export type StateMachineEvent<Type, State, Action> = {
  type: Type;
} & StateMachineEventData<State, Action>;

export type StateMachineEventData<State, Action> = {
  from: State;
  to: State;
  by: Action | State;
};

export const enum StateMachineEvents {
  stateChange = 'stateChange',
}

export type StateMachineEventsMap<State, Action> = {
  [Type in keyof typeof StateMachineEvents]: StateMachineEvent<Type, State, Action>;
};

export type StateMachineEventListener<Type, State, Action> = (event: StateMachineEvent<Type, State, Action>) => void;

export interface IStateMachine<State, Action = State> extends Emitter<StateMachineEventsMap<State, Action>> {
  get state(): State;
  isInState(state: State): state is State;
}
