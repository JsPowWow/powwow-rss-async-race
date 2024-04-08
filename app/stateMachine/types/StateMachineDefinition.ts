export type IStateMachineDefinition<State, Action = State> = {
  initialState: State;
  getNextState: (currentState: State, next: Action | State) => State;
};
