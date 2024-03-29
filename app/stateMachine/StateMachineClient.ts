import { EventEmitter } from '@/event-emitter';
import type { ScopedLogger } from '@/utils';
import { getLogger } from '@/utils';

import type { IState } from './types/State.ts';
import type { IStateMachine, StateMachineEventListener } from './types/StateMachine.ts';
import type { IStateMachineClient, StateMachineClientEventsMap, Unsubscribe } from './types/StateMachineClient.ts';

const compareStates = (stateA: unknown, stateB: unknown): boolean => {
  const sA = stateA && typeof stateA === 'object' && 'state' in stateA ? stateA.state : stateA;
  const sB = stateB && typeof stateB === 'object' && 'state' in stateB ? stateB.state : stateB;
  return sA === sB;
};

export class StateMachineClient<State>
  extends EventEmitter<StateMachineClientEventsMap<State>>
  implements IStateMachineClient<State>
{
  protected readonly logger: ScopedLogger; // TODO AR optional

  protected readonly name: string;

  private readonly stateMachine: IStateMachine<State>;

  constructor(stateMachine: IStateMachine<State>, options?: { name?: string; debug?: boolean }) {
    super();
    const { name = '', debug = false } = options ?? {};
    this.name = name;
    this.stateMachine = stateMachine;
    this.logger = getLogger(this.constructor.name);
    if (debug) {
      this.logger.setEnabled(true);
    }
    this.stateMachine.on('stateChange', this.onStateMachineChangeHandler);
  }

  public get state(): State {
    return this.stateMachine.state;
  }

  public onStateEnter<Data>(
    enterState: State extends IState<Data> ? State['state'] : State,
    callBack: StateMachineEventListener<'stateEnter', State>,
  ): Unsubscribe {
    const onEnterStateImpl: typeof callBack = (event) => {
      if (compareStates(event.to, enterState)) {
        callBack(event);
      }
    };
    this.on('stateEnter', onEnterStateImpl);
    return (): void => {
      this.off('stateEnter', onEnterStateImpl);
    };
  }

  public onStateLeave<Data>(
    leaveState: State extends IState<Data> ? State['state'] : State,
    callBack: StateMachineEventListener<'stateLeave', State>,
  ): Unsubscribe {
    const onLeaveStateImpl: typeof callBack = (event) => {
      if (compareStates(event.from, leaveState)) {
        callBack(event);
      }
    };
    this.on('stateLeave', onLeaveStateImpl);
    return (): void => {
      this.off('stateLeave', onLeaveStateImpl);
    };
  }

  public onStateTransition<Data>(
    from: State extends IState<Data> ? State['state'] : State,
    to: State extends IState<Data> ? State['state'] : State,
    callBack: StateMachineEventListener<'stateTransition', State>,
  ): Unsubscribe {
    const onTransitionImpl: typeof callBack = (event) => {
      if (compareStates(event.from, from) && compareStates(event.to, to)) {
        callBack(event);
      }
    };
    this.on('stateTransition', onTransitionImpl);
    return (): void => {
      this.off('stateTransition', onTransitionImpl);
    };
  }

  public onStateChange(callBack: StateMachineEventListener<'stateChange', State>): Unsubscribe {
    this.on('stateChange', callBack);
    return (): void => {
      this.off('stateChange', callBack);
    };
  }

  protected onStateMachineChangeHandler: StateMachineEventListener<'stateChange', State> = ({ from, to }): void => {
    this.emitTransitionListeners('stateLeave', from, to);
    this.emitTransitionListeners('stateEnter', from, to);
    this.emitTransitionListeners('stateTransition', from, to);
    this.emitTransitionListeners('stateChange', from, to);
  };

  private emitTransitionListeners(eventType: keyof StateMachineClientEventsMap<State>, from: State, to: State): void {
    try {
      this.emit(eventType, { type: eventType, from, to });
    } catch (e) {
      this.logger.error(`${this.name}: Error occurred in listener on ${String(from)} -> ${String(to)}`, e);
    }
  }

  // TODO AR async helpers (?)
  // private waitForLeave(state: T): Promise<T> {
  //   return new Promise<T>((resolve) => {
  //     if (this._state !== state) {
  //       resolve(this._state);
  //     } else {
  //       const registration = this.onLeaveState(state, (_from, to) => {
  //         registration.cancel();
  //         resolve(to);
  //       });
  //     }
  //   });
  // }
  //
  // private waitForEnter(state: T): Promise<T> {
  //   return this.waitForEnterOneOf([state]);
  // }

  // private waitForEnterOneOf(states: T[]): Promise<T> {
  //   return new Promise<T>((resolve) => {
  //     if (states.indexOf(this._state) !== -1) {
  //       resolve(this._state);
  //     } else {
  //       const registrations: ListenerRegistration[] = [];
  //       let finished = false;
  //       for (const state of states) {
  //         const registration = this.onEnterState(state, (_from, to) => {
  //           registration.cancel();
  //           registrations.forEach((reg) => {
  //             if (registration !== reg) {
  //               reg.cancel();
  //             }
  //           });
  //           finished = true;
  //           resolve(to);
  //         });
  //         if (finished) {
  //           break;
  //         }
  //         registrations.push(registration);
  //       }
  //     }
  //   });
  // }
}
