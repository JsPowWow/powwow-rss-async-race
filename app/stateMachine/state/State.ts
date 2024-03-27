import type { IState } from '../types/State.ts';

export class State implements IState {
  private readonly stateName: string;

  constructor(name: string) {
    if (!name || !name.trim()) {
      throw Error('Expect to have non-empty state name.');
    }
    this.stateName = name;
  }

  public get state(): string {
    return this.stateName;
  }

  public toString = (): string => {
    return this.stateName;
  };
}
