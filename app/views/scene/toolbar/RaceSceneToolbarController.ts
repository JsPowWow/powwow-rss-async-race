import { match } from 'ts-pattern';

import { EventEmitter } from '@/event-emitter';
import { StateMachineClient } from '@/state-machine';
import { noop } from '@/utils';

import type { CarToolbarAction, CarsToolbar } from './CarsToolbar.ts';
import type { RaceSceneToolbar, SceneToolbarAction } from './RaceSceneToolbar.ts';
import type { RaceScene } from '../RaceScene.ts';
import type { RaceSceneStateMachine } from '../RaceSceneState.ts';
import { RaceState } from '../RaceSceneState.ts';

export class RaceSceneToolbarController extends EventEmitter<{
  onSceneToolbarAction: SceneToolbarAction;
  onCarToolbarAction: CarToolbarAction;
}> {
  private readonly toolbarStateClient: StateMachineClient<RaceState>;

  private readonly raceToolbar: RaceSceneToolbar;

  private readonly carsToolbar: CarsToolbar;

  constructor(raceState: RaceSceneStateMachine, scene: RaceScene) {
    super();
    this.carsToolbar = scene.carsToolbar;
    this.raceToolbar = scene.toolbar;
    this.raceToolbar.onAction(this.onSceneToolbarAction);
    this.carsToolbar.onAction(this.onCarToolbarAction);
    this.toolbarStateClient = new StateMachineClient(raceState);
    this.raceToolbar.setEnabled({ start: false, reset: false });

    this.toolbarStateClient.on('stateEnter', (event) => {
      match(event.to)
        .with(RaceState.ready, () => this.raceToolbar.setEnabled({ start: true, reset: true }))
        .with(RaceState.error, () => this.raceToolbar.setEnabled({ start: false, reset: false }))
        .with(RaceState.started, () => this.raceToolbar.setEnabled({ start: false, reset: false }))
        .with(RaceState.finished, () => this.raceToolbar.setEnabled({ start: false, reset: true }))
        .otherwise(noop);
    });
  }

  private onSceneToolbarAction = (action: SceneToolbarAction): void => {
    this.emit('onSceneToolbarAction', action);
  };

  private onCarToolbarAction = (action: CarToolbarAction): void => {
    this.emit('onCarToolbarAction', action);
  };
}
