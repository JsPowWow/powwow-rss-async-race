import type { IState } from '../types/State.ts';

export class State<Data, Name extends string> implements IState<Data, Name> {
  private readonly stateName: Name;

  public readonly data: Data;

  constructor(name: Name, data: Data) {
    if (!name || !name.trim()) {
      throw Error('Expect to have non-empty state name.');
    }
    this.stateName = name;
    this.data = data;
  }

  public get state(): Name {
    return this.stateName;
  }

  public toString = (): string => {
    return this.stateName;
  };
}
