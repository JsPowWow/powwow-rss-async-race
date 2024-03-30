import { Component, NeonText } from '@/components';
import logger from '@/logger';
import { RaceScene, RaceSceneController } from '@/views/race-scene';

import classes from './RacePageStandalone.module.css';
import { debug } from '../../debug.ts';

export class RacePageStandalone extends Component<'div'> {
  private readonly scene: RaceScene;

  constructor(root: HTMLElement) {
    super('div');
    this.toggleClass(classes.racePageContainer);
    this.scene = new RaceScene();

    root.append(this.element);
  }

  public draw(): typeof this {
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    this.appendChildren([new NeonText().setTextContent('Async race'), this.scene]);

    new RaceSceneController(this.scene).initialize().catch(logger.error);

    return this;
  }
}

debug.initialize({ sceneController: true });
