import { match } from 'ts-pattern';

import type { GetGarageCarsResponse } from '@/api/race';
import { getCarImage, getGarageCars, getRoadImage } from '@/api/race';
import type { EventEmitter } from '@/event-emitter';
import type { ScopedLogger } from '@/utils';
import { assertIsNonNullable, getLogger, isSome } from '@/utils';

import type { CarCreateParamsFactory, RoadCreateParamsFactory } from './models/Traffic.ts';
import { Traffic } from './models/Traffic.ts';
import { TrafficManager } from './models/trafficManager.ts';
import type { RaceScene } from './RaceScene.ts';
import { RaceSceneStateMachine, RaceState } from './RaceSceneState.ts';
import type { SceneToolbarAction } from './toolbar/RaceSceneToolbar.ts';
import { RaceSceneToolbarController } from './toolbar/RaceSceneToolbarController.ts';

let logger: ScopedLogger;

export class RaceSceneController {
  static {
    logger = getLogger(this.name);
  }

  public static get logger(): ScopedLogger {
    return logger;
  }

  private readonly scene: RaceScene;

  private traffic?: Traffic;

  private readonly raceState: RaceSceneStateMachine;

  private readonly toolbarController: EventEmitter<{ onToolbarAction: SceneToolbarAction }>;

  private trafficCarImg?: HTMLImageElement;

  private heroCarImg?: HTMLImageElement;

  private roadImg?: HTMLImageElement;

  constructor(scene: RaceScene) {
    this.scene = scene;
    this.raceState = new RaceSceneStateMachine();
    this.toolbarController = new RaceSceneToolbarController(this.raceState, this.scene);
    this.toolbarController.on('onToolbarAction', this.onToolbarAction);
  }

  public initialize = async (): Promise<void> => {
    if (!this.trafficCarImg) {
      this.trafficCarImg = await getCarImage('car1');
    }
    if (!this.heroCarImg) {
      this.heroCarImg = await getCarImage('car3');
    }

    if (!this.roadImg) {
      this.roadImg = await getRoadImage();
    }

    await getGarageCars()
      .then((either) => {
        either.fold(
          (err) => {
            this.raceState.setState(RaceState.error);
            logger.error(err);
          },
          (cars) => {
            this.raceState.setState(RaceState.ready);
            this.buildScene(cars);
          },
        );
      })
      .catch(logger.error);
  };

  public startRace = async (): Promise<void> => {
    assertIsNonNullable(this.traffic);
    this.raceState.setState(RaceState.started);

    const localDistance = this.scene.getCanvasSize().width - 50;
    this.traffic.getRoad().setFinishBorderPos(this.scene.getCanvasSize().width - 100);
    const cars = this.traffic.cars();
    await Promise.allSettled(cars.map(TrafficManager.startCarEngine));

    cars.forEach((c) => {
      c.car.setSpeed(TrafficManager.getLocalSpeed(localDistance, c));
    });

    await Promise.allSettled(cars.map(TrafficManager.driveCar));

    this.raceState.setState(RaceState.finished);
  };

  private getTrafficCarDefaultParams = (): ReturnType<CarCreateParamsFactory> => {
    return {
      skin: {
        img: this.trafficCarImg,
      },
    };
  };

  private getHeroCarDefaultParams = (): ReturnType<CarCreateParamsFactory> => {
    return {
      color: 'rgba(0,0,0,0)',
      skin: {
        img: this.heroCarImg,
      },
    };
  };

  private getRoadDefaultParams = (): ReturnType<RoadCreateParamsFactory> => {
    return {
      skin: {
        img: this.roadImg,
      },
    };
  };

  private buildScene = (cars: GetGarageCarsResponse): void => {
    if (isSome(this.traffic)) {
      this.traffic.destroy();
    }
    const traffic = new Traffic(cars, {
      roadLineSize: 90,
      getTrafficCarParams: (car): ReturnType<CarCreateParamsFactory> => {
        return {
          color: car.color,
          ...this.getTrafficCarDefaultParams(),
        };
      },
      getHeroCarParams: this.getHeroCarDefaultParams,
      getRoadParams: this.getRoadDefaultParams,
    });

    traffic.cars().forEach((car) => {
      car.stateClient.onStateEnter('ready', (e) => {
        if (e.to.state === 'ready') {
          const { time } = car.getDriveStartData();
          logger.info(`${car.id} is ready (time ${(time / 1000).toFixed(2)}s)`);
        }
      });
      car.stateClient.onStateTransition('drive', 'finish', (e) => {
        if (e.from.state === 'drive' && e.to.state === 'finish') {
          car.car.setSpeed(0);
        }
      });
      car.stateClient.onStateEnter('error', (e) => {
        if (e.to.state === 'error') {
          car.car.setSpeed(0);
          logger.warn(car, 'is in error state', { err: e.to.data });
        }
      });
    });

    this.traffic = traffic;
    logger.info('buildScene', this.traffic);
    this.scene.draw(this.traffic);
  };

  private onToolbarAction = (action: SceneToolbarAction): void => {
    logger.info('toolbarAction', `"${action}"`);

    match(action)
      .with('reset', (_a) => {
        this.initialize().catch(logger.error);
      })
      .with('start', (_a) => {
        this.startRace().catch(logger.error);
      })
      .exhaustive();
  };
}
