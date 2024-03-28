export interface IState<Data, State extends string = string> {
  readonly state: State;
  readonly data: Data;
  toString: () => string;
}
