import type { CarEngineDriveFinishData, CarEngineStartedData } from '@/api/race';
import { setCarEngineDrive, setCarEngineStarted } from '@/api/race';
import { LOCAL_SPEED } from '@/engine';
import { State } from '@/state-machine';

import type { TrafficCar } from './TrafficCar.ts';

const setCarError =
  (car: TrafficCar) =>
  (err: Error): TrafficCar =>
    car.setState(new State('error', err));

const setCarReady =
  (car: TrafficCar) =>
  (resp: CarEngineStartedData): TrafficCar => {
    return car.setState(new State('ready', resp));
  };

const setCarFinish =
  (car: TrafficCar) =>
  (resp: CarEngineDriveFinishData): TrafficCar => {
    return car.setState(new State('finish', resp));
  };

const setCarDrive = (car: TrafficCar): TrafficCar => {
  return car.setState(new State('drive', undefined));
};

export class TrafficManager {
  public static startCarEngine = async (car: TrafficCar): Promise<TrafficCar> => {
    return setCarEngineStarted(car).then((e) => e.fold(setCarError(car), setCarReady(car)));
  };

  public static driveCar = async (car: TrafficCar): Promise<TrafficCar> => {
    return Promise.resolve(car)
      .then(setCarDrive)
      .then(setCarEngineDrive)
      .then((e) => e.fold(setCarError(car), setCarFinish(car)));
  };

  public static getLocalSpeed = (localDistance: number, car: TrafficCar): number => {
    return localDistance / (car.getDriveStartData().time * LOCAL_SPEED);
  };

  public static getDriveData =
    (trafficDistance: number) =>
    (car: TrafficCar): CarEngineStartedData & { time: number } => {
      const { distance, time, velocity, ...rest } = car.getDriveStartData();
      const localVelocity = (trafficDistance * velocity) / distance;
      return { ...rest, distance: trafficDistance, time, velocity: localVelocity };
    };

  public static getVelocity = (car: TrafficCar): number => {
    if (car.state.state === 'ready') {
      return car.state.data.velocity;
    }
    return 0;
  };
}
