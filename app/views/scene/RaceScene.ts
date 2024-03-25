import { CanvasComponent, Component } from '@/components';
import type { Car, RoadHorizontal } from '@/engine';
import { debounce } from '@/utils';

import classes from './RaceScene.module.css';
import { RaceSceneToolbar } from './RaceSceneToolbar.ts';

export class RaceScene extends Component<'div'> {
  public readonly toolbar: RaceSceneToolbar;

  private readonly canvas: CanvasComponent;

  constructor() {
    super('div');
    this.canvas = new CanvasComponent().toggleClass(classes.sceneCanvas);
    this.toggleClass(classes.sceneContainer);

    this.toolbar = this.appendChild(new RaceSceneToolbar().setEnabled({ reset: true, stop: false, start: false }));

    this.appendChild(new Component('div').toggleClass(classes.sceneCanvasWrapper).appendChildren([this.canvas]));
  }

  public draw(options: { road: RoadHorizontal; traffic: Car[] }): typeof this {
    const { road, traffic } = options;
    this.observe(
      debounce((entry: ResizeObserverEntry): void => {
        this.canvas.setSize(entry.contentRect.width, road.height * 1.1);
      }, 100),
    );

    CanvasComponent.withUseCanvasContext2D(this.canvas)(({ ctx }) => {
      this.animate({ ctx, road, traffic });
    });

    // const car = new Car(0, road.getLaneCenter(1), 30, 50, 'KEYS');
    // const traffic = [new Car(road.getLaneCenter(1), -100, 30, 50, 'SELF', 2)];

    return this;
  }

  private animate(sceneInfo: { ctx: CanvasRenderingContext2D; traffic: Car[]; road: RoadHorizontal }): void {
    const { ctx, road, traffic } = sceneInfo;
    // this.canvas.element.height = 200;
    // this.canvas.element.width = window.innerWidth;

    for (let i = 0; i < traffic.length; i++) {
      traffic[i].update(road.borders, []);
    }
    // car.update(road.borders, traffic);

    // canvas.height = window.innerHeight;
    // this.canvas.element.height = 200;
    // this.canvas.element.width = window.innerWidth;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    // ctx.translate(0, -car.y + rect.height * 0.7);
    // ctx.translate(-car.xPos + rect.width * 0.7, 0);
    // ctx.translate(-car.x + car.width * 1.5, 0);

    road.draw(ctx);

    for (let i = 0; i < traffic.length; i++) {
      traffic[i].draw(ctx);
    }
    // car.draw(ctx, 'blue');

    ctx.restore();
    requestAnimationFrame(() => this.animate(sceneInfo));
  }
}
