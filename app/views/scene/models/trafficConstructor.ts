import type { GetGarageCarsResponse } from '@/api/race';
import type { RoadHorizontalInput } from '@/engine';
import { Car, RoadHorizontal } from '@/engine';
import type { Size } from '@/geometry';
import { Dimension } from '@/geometry';
import { getLogger } from '@/utils';

import type { CarsCreateOptions } from './Traffic.ts';
import { TrafficCar } from './TrafficCar.ts';

const createRoad = (input: Omit<RoadHorizontalInput, 'y' | 'height'> & { roadSize: number }): RoadHorizontal => {
  const { laneCount, endPos, roadSize } = input;
  return new RoadHorizontal({
    ...input,
    y: roadSize / 2,
    height: roadSize * 0.9,
    laneCount,
    endPos,
  });
};

const createTrafficCars = (
  cars: GetGarageCarsResponse,
  road: RoadHorizontal,
  { getTrafficCarParams, carSize }: CarsCreateOptions & { carSize: Size },
): Array<TrafficCar> => {
  return cars.map((responseCar, index): TrafficCar => {
    const { id } = responseCar;
    const carParams = getTrafficCarParams(responseCar);
    const car = new Car({
      name: index.toString(),
      ...carParams,
      x: carSize.height / 2 + 10,
      y: road.getLaneCenter(index),
      width: carSize.width,
      height: carSize.height,
      controlType: 'SELF',
      speed: 0,
      startAngle: -Math.PI / 2,
    });

    return new TrafficCar({ id, car, name: `car${id}`, debug: true, logger: getLogger('Car').setEnabled(true) });
  });
};

export const createFromResponse = (
  cars: GetGarageCarsResponse,
  options: CarsCreateOptions,
): {
  trafficCars: Array<TrafficCar>;
  heroCar: Car;
  road: RoadHorizontal;
} => {
  const { getHeroCarParams, roadLineSize = 75, roadFinishPos, getRoadParams } = options;

  const roadSize = cars.length * roadLineSize;

  const road = createRoad({
    ...getRoadParams(),
    laneCount: cars.length + 1,
    endPos: roadFinishPos,
    roadSize,
  });

  const carSize = new Dimension(30, /* road.getLaneSize() * 0.7 */ 60);

  const trafficCars = createTrafficCars(cars, road, { ...options, carSize });

  const heroCarParams = getHeroCarParams({ id: -1, color: 'blue', name: 'Hero' });

  const heroCar = new Car({
    name: 'Hero',
    ...heroCarParams,
    x: carSize.height / 2 + 20,
    y: road.getLaneCenter(trafficCars.length + 1),
    width: carSize.width,
    height: carSize.height,
    controlType: 'KEYS',
    speed: 2.3,
    startAngle: -Math.PI / 2,
  });

  return {
    trafficCars,
    heroCar,
    road,
  };
};
