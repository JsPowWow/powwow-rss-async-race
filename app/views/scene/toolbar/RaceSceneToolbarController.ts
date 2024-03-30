import { match } from 'ts-pattern';

import { EventEmitter } from '@/event-emitter';
import { StateMachineClient } from '@/state-machine';
import { noop } from '@/utils';

import type { RaceSceneToolbar, ToolbarAction } from './RaceSceneToolbar.ts';
import type { RaceScene } from '../RaceScene.ts';
import type { RaceSceneStateMachine } from '../RaceSceneState.ts';
import { RaceState } from '../RaceSceneState.ts';

export class RaceSceneToolbarController extends EventEmitter<{ onToolbarAction: ToolbarAction }> {
  private readonly toolbarStateClient: StateMachineClient<RaceState>;

  private readonly toolbar: RaceSceneToolbar;

  constructor(raceState: RaceSceneStateMachine, scene: RaceScene) {
    super();
    this.toolbar = scene.toolbar;
    this.toolbar.onAction(this.onToolbarAction);
    this.toolbarStateClient = new StateMachineClient(raceState);
    this.toolbar.setEnabled({ start: false, reset: false });
    this.toolbarStateClient.on('stateEnter', (event) => {
      match(event.to)
        .with(RaceState.ready, () => this.toolbar.setEnabled({ start: true, reset: true }))
        .with(RaceState.error, () => this.toolbar.setEnabled({ start: false, reset: false }))
        .with(RaceState.started, () => this.toolbar.setEnabled({ start: false, reset: false }))
        .with(RaceState.finished, () => this.toolbar.setEnabled({ start: false, reset: true }))
        .otherwise(noop);
    });
  }

  private onToolbarAction = (action: ToolbarAction): void => {
    this.emit('onToolbarAction', action);
  };
}
