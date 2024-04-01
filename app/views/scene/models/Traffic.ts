import type { GarageCarResponse, GetGarageCarsResponse } from '@/api/race';
import type { CarInput, RoadHorizontalInput } from '@/engine';
import { Car, RoadHorizontal } from '@/engine';

import type { TrafficCar } from './TrafficCar.ts';
import { createFromResponse } from './trafficConstructor.ts';

export type CarCreateParamsFactory = (
  car: GarageCarResponse,
) => Partial<Pick<CarInput, 'x' | 'y' | 'width' | 'height' | 'color' | 'skin'>>;

export type RoadCreateParamsFactory = () => Partial<Pick<RoadHorizontalInput, 'skin'>>;

export type CarsCreateOptions = {
  getTrafficCarParams: CarCreateParamsFactory;
  getHeroCarParams: CarCreateParamsFactory;
  getRoadParams: RoadCreateParamsFactory;
  roadLineSize?: number;
  roadFinishPos?: number;
};

export class Traffic {
  private trafficCars: Array<TrafficCar> = [];

  private heroCar: Car;

  private road: RoadHorizontal;

  constructor(cars: GetGarageCarsResponse, options: CarsCreateOptions) {
    const { trafficCars, heroCar, road } = createFromResponse(cars, options);
    this.trafficCars = trafficCars;
    this.heroCar = heroCar;
    this.road = road;
  }

  public cars(): Array<TrafficCar> {
    return this.trafficCars.concat();
  }

  public getHeroCar(): typeof this.heroCar {
    return this.heroCar;
  }

  public getRoad(): typeof this.road {
    return this.road;
  }

  public destroy(): void {
    this.trafficCars = [];
    this.road = new RoadHorizontal({ y: 0, height: 0, laneCount: 0 });
    this.trafficCars.forEach((car) => car.destroy());
    this.heroCar = new Car({ x: 0, y: 0, width: 0, height: 0, controlType: 'KEYS' });
  }
}
