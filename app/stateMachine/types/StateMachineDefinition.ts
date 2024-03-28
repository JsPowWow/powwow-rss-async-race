export interface IStateMachineDefinition<State> {
  initialState: State;
  getNextState: (currentState: State, newState: State) => State;
}
