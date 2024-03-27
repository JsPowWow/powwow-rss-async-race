import { EventEmitter } from '@/event-emitter';
import type { ScopedLogger } from '@/utils';
import { getLogger } from '@/utils';

import type { IStateMachine, StateMachineEventListener } from './types/StateMachine.ts';
import type { IStateMachineClient, StateMachineClientEventsMap, Unsubscribe } from './types/StateMachineClient.ts';

export class StateMachineClient<S>
  extends EventEmitter<StateMachineClientEventsMap<S>>
  implements IStateMachineClient<S>
{
  protected readonly logger: ScopedLogger;

  protected readonly name: string;

  private readonly stateMachine: IStateMachine<S>;

  constructor(stateMachine: IStateMachine<S>, options?: { name?: string; debug?: boolean }) {
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

  public get state(): S {
    return this.stateMachine.state;
  }

  public onStateEnter(state: S, callBack: StateMachineEventListener<'stateEnter', S>): Unsubscribe {
    const onEnterStateImpl: typeof callBack = (event) => {
      if (event.to === state) {
        callBack(event);
      }
    };
    this.on('stateEnter', onEnterStateImpl);
    return (): void => {
      this.off('stateEnter', onEnterStateImpl);
    };
  }

  public onStateLeave(state: S, callBack: StateMachineEventListener<'stateLeave', S>): Unsubscribe {
    const onLeaveStateImpl: typeof callBack = (event) => {
      if (event.from === state) {
        callBack(event);
      }
    };
    this.on('stateLeave', onLeaveStateImpl);
    return (): void => {
      this.off('stateLeave', onLeaveStateImpl);
    };
  }

  public onStateTransition(from: S, to: S, callBack: StateMachineEventListener<'stateTransition', S>): Unsubscribe {
    const onTransitionImpl: typeof callBack = (event) => {
      if (event.from === from && event.to === to) {
        callBack(event);
      }
    };
    this.on('stateTransition', onTransitionImpl);
    return (): void => {
      this.off('stateTransition', onTransitionImpl);
    };
  }

  public onStateChange(callBack: StateMachineEventListener<'stateChange', S>): Unsubscribe {
    this.on('stateChange', callBack);
    return (): void => {
      this.off('stateChange', callBack);
    };
  }

  protected onStateMachineChangeHandler: StateMachineEventListener<'stateChange', S> = ({ from, to }): void => {
    this.emitTransitionListeners('stateLeave', from, to);
    this.emitTransitionListeners('stateEnter', from, to);
    this.emitTransitionListeners('stateTransition', from, to);
    this.emitTransitionListeners('stateChange', from, to);
  };

  private emitTransitionListeners(eventType: keyof StateMachineClientEventsMap<S>, from: S, to: S): void {
    try {
      this.emit(eventType, { type: eventType, from, to });
    } catch (e) {
      this.logger.error(`${this.name}: Uncaught error occurred in listener on ${String(from)} -> ${String(to)}`, e);
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
