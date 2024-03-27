import type { BaseStateMachineInput } from './BaseStateMachine.ts';
import { BaseStateMachine } from './BaseStateMachine.ts';
import { StateMachineEvents } from './types/StateMachine.ts';
import type { Transitions } from './types/Transition.ts';

export class StateMachine<S> extends BaseStateMachine<S> {
  private readonly transitions: Transitions<S>;

  constructor(input: BaseStateMachineInput<S> & { transitions: Transitions<S> }) {
    super(input);

    this.transitions = input.transitions;
  }

  public override setState(newState: S): boolean {
    this.assertCanGoToState(newState);
    this.logger?.info(`${this.name} change ${String(this.currentState)} -> ${String(newState)}`);
    const from = this.currentState;
    this.currentState = newState;

    try {
      this.emit(StateMachineEvents.stateChange, { type: 'stateChange', from, to: newState });
      return true;
    } catch (e) {
      this.logger?.error(
        `${this.name}: Uncaught error occurred in listener on ${String(from)} -> ${String(newState)}`,
        e,
      );
      return false;
    }
  }

  private assertCanGoToState(newState: S): void {
    if (!this.transitions.validate(newState)) {
      throw new Error(`No defined transition found from ${String(this.currentState)} to ${String(newState)}`);
    }
  }
}
