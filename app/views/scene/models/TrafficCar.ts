import type { CarEngineDriveFinishData, CarEngineStartedData } from '@/api/race';
import type { Car } from '@/engine';
import type { IState, IStateMachineDefinition } from '@/state-machine';
import { State, StateMachine, StateMachineClient } from '@/state-machine';
import type { WithDebugOptions } from '@/utils';

export type CarState =
  | IState<undefined, 'init'>
  | IState<CarEngineStartedData, 'ready'>
  | IState<undefined, 'drive'>
  | IState<CarEngineDriveFinishData, 'finish'>
  | IState<Error, 'error'>;

const transitions: Record<CarState['state'], Array<CarState['state']>> = {
  // from | next state(s)
  init: ['ready'],
  ready: ['drive', 'error'],
  drive: ['init', 'finish', 'error'],
  finish: ['ready'],
  error: ['init', 'ready'],
};

const carStateDefinition: IStateMachineDefinition<CarState> = {
  initialState: new State('init', undefined),
  getNextState: (current, next): CarState => {
    if (transitions[current.state] && transitions[current.state].includes(next.state)) {
      return next;
    }
    throw new Error(`Transition (${String(current)} -> ${String(next)}) is not configured`);
  },
};

export class TrafficCar extends StateMachine<CarState> {
  // TODO AR make private
  public readonly car: Car;

  public readonly id: number;

  public stateClient: StateMachineClient<CarState>;

  constructor(input: WithDebugOptions<{ id: number; car: Car; name: string }>) {
    const { id, car, name, ...rest } = input;
    super({ name, definition: carStateDefinition, ...rest });
    this.stateClient = new StateMachineClient<CarState>(this, { name: `car${id}` });
    this.id = id;
    this.car = car;
  }

  public static toPaintCar = (c: TrafficCar): Car => c.car;

  public getDriveStartData = (): CarEngineStartedData & { time: number } => {
    if (this.state.state === 'ready') {
      const { velocity, distance } = this.state.data;
      return { carId: this.id, velocity, distance, time: distance / velocity };
    }
    return { carId: this.id, velocity: NaN, distance: NaN, time: NaN };
  };
}
