export type Transition<FromState extends string, ToState extends string> = `${FromState | '*'} --> ${ToState | '*'}`;
// export type Transitions<T extends IState> = Record<Transition<T['name'], T['name']>, T[]>;
// export type Transitions<State extends IState> = Map<State, State[]>;

export interface Transitions<State> {
  validate: (currentState: State) => (newState: State) => boolean;
}
