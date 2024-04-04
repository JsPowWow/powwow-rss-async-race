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

  public readonly canvas: RaceSceneCanvas;

  public readonly smokeCanvas: Component<'canvas'>;

  constructor() {
    super('div');

    this.toggleClass(classes.sceneContainer);
    this.smokeCanvas = new Component<'canvas'>('canvas').toggleClass(classes.smokeCanvas);
    this.canvas = new RaceSceneCanvas(this.smokeCanvas).toggleClass(classes.sceneCanvas);

    this.toolbar = this.appendChild(new RaceSceneToolbar());
    this.carsToolbar = new CarsToolbar().toggleClass(classes.sceneCarsToolbar);
    this.appendChild(
      new Component('div')
        .toggleClass(classes.sceneCanvasContainer)
        .appendChildren([this.carsToolbar, this.canvas, this.smokeCanvas]),
    );
    this.appendChild(
      new Component('div').toggleClass(classes.sceneTip).setTextContent(
        `Use the ${String.fromCodePoint(0x2190)}
          ${String.fromCodePoint(0x2191)}
          ${String.fromCodePoint(0x2192)}
          ${String.fromCodePoint(0x2193)}
          arrow keys to manage red 🔥 hero car          
          `,
      ),
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
