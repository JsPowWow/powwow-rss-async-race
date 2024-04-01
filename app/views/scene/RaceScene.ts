import { Component } from '@/components';
import type { Size } from '@/geometry';
import { debounce } from '@/utils';

import { RaceSceneCanvas } from './canvas/RaceSceneCanvas.ts';
import type { Traffic } from './models/Traffic.ts';
import classes from './RaceScene.module.css';
import { CarsToolbar } from './toolbar/CarsToolbar.ts';
import { RaceSceneToolbar } from './toolbar/RaceSceneToolbar.ts';

export class RaceScene extends Component<'div'> {
  public readonly toolbar: RaceSceneToolbar;

  public readonly carsToolbar: CarsToolbar;

  private readonly canvas: RaceSceneCanvas;

  constructor() {
    super('div');

    this.toggleClass(classes.sceneContainer);
    this.canvas = new RaceSceneCanvas().toggleClass(classes.sceneCanvas);
    this.toolbar = this.appendChild(new RaceSceneToolbar());
    this.carsToolbar = new CarsToolbar().toggleClass(classes.sceneCarsToolbar);
    this.appendChild(
      new Component('div').toggleClass(classes.sceneCanvasContainer).appendChildren([this.carsToolbar, this.canvas]),
    );
  }

  public draw(traffic: Traffic): typeof this {
    this.carsToolbar.draw(traffic);
    this.observe(
      debounce((entry: ResizeObserverEntry): void => {
        this.canvas.setSize(entry.contentRect.width, traffic.getRoad().height * 1.1);
      }, 100),
    );
    this.canvas.draw(traffic);

    return this;
  }

  public getCanvasSize(): Size {
    return this.canvas.getSize();
  }
}
