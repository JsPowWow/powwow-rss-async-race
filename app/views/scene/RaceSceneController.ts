import { match } from 'ts-pattern';

import { getCars } from '@/api/race';
import { Car, RoadHorizontal } from '@/engine';
import { Dimension } from '@/geometry';
import type { ScopedLogger } from '@/utils';
import { getLogger } from '@/utils';

import type { RaceScene } from './RaceScene.ts';
import type { RaceSceneToolbar, ToolbarAction } from './RaceSceneToolbar.ts';
import type { CarsResponse } from '../../api/race/types.ts';

let logger: ScopedLogger;

export class RaceSceneController {
  static {
    logger = getLogger(this.name);
  }

  public static get logger(): ScopedLogger {
    return logger;
  }

  private readonly scene: RaceScene;

  private readonly toolbar: RaceSceneToolbar;

  private traffic: Car[] = [];

  private road?: RoadHorizontal;

  constructor(scene: RaceScene) {
    this.scene = scene;
    this.toolbar = scene.toolbar;
    this.toolbar.onAction(this.onToolbarAction);
    this.toolbar.setEnabled({ start: false, stop: false, reset: false });
  }

  public initialize(): void {
    getCars()
      .then((either) => {
        either.fold(logger.error, (cars) => {
          this.buildScene(cars);
          this.toolbar.setEnabled({ start: true, stop: false, reset: true });
        });
      })
      .catch(logger.error);
  }

  private buildScene = (cars: CarsResponse): void => {
    const roadLineSize = 45;
    const roadSize = cars.length * roadLineSize;
    const road = new RoadHorizontal({
      y: roadSize / 2,
      height: roadSize * 0.9,
      laneCount: cars.length + 1,
    });
    this.road = road;
    const carSize = new Dimension(road.getLaneSize() * 0.7, 50);
    this.traffic = cars.map(({ color }, index) => {
      return new Car({
        x: carSize.height / 2,
        y: road.getLaneCenter(index),
        width: carSize.width,
        height: carSize.height,
        controlType: 'SELF',
        speed: 0,
        color,
      });
    });
    const car = new Car({
      x: carSize.height / 2,
      y: road.getLaneCenter(cars.length + 1),
      width: carSize.width,
      height: carSize.height,
      controlType: 'KEYS',
      speed: 0,
      color: 'blue',
    });
    this.traffic.push(car);
    const sceneDrawData = { road: this.road, traffic: this.traffic };
    logger.info('buildScene', sceneDrawData);
    this.scene.draw(sceneDrawData);
  };

  private onToolbarAction = (action: ToolbarAction): void => {
    logger.info('onToolbarAction', `"${action}"`);
    match(action)
      .with('reset', (_a) => {
        this.initialize();
      })
      .with('start', (_a) => {
        this.toolbar.setEnabled({ stop: true, start: false });
        this.traffic.forEach((car) => {
          car.setSpeed(Math.random() * 1.5);
        });
      })
      .with('stop', (_a) => {
        this.toolbar.setEnabled({ stop: false, start: true });
        this.traffic.forEach((car) => {
          car.setSpeed(0);
        });
      })
      .exhaustive();
  };
}
