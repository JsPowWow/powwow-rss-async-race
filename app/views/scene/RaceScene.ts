import { CanvasComponent, Component } from '@/components';
import { Car, RoadHorizontal } from '@/engine';
import type { Rect } from '@/geometry';
import { Rectangle, getElementBounds } from '@/geometry';
import { assertIsNonNullable } from '@/utils';

import classes from './RaceScene.module.css';

export class RaceScene extends Component<'div'> {
  private readonly canvas: CanvasComponent;

  // private readonly canvasWrapper: Component<'div'>;

  constructor() {
    super('div');
    this.canvas = new CanvasComponent().toggleClass(classes.sceneCanvas);
    this.toggleClass(classes.sceneContainer);
    this.appendChild(new Component('div').toggleClass(classes.sceneCanvasWrapper).appendChildren([this.canvas]));
  }

  public draw(): typeof this {
    const canvas = this.canvas.element;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    assertIsNonNullable(ctx);
    canvas.width = getElementBounds(this.element).width - 10;

    const road = new RoadHorizontal(canvas.height / 2, canvas.height * 0.9);
    const car = new Car(0, road.getLaneCenter(1), 30, 50, 'KEYS');
    // const traffic = [new Car(road.getLaneCenter(1), -100, 30, 50, 'SELF', 2)];
    const traffic = [
      new Car(0, road.getLaneCenter(0), 30, 50, 'SELF', 1),
      new Car(40, road.getLaneCenter(2), 30, 50, 'SELF', 1),
    ];

    const rect = new Rectangle(0, 0, canvas.width, canvas.height);

    this.animate({ ctx, rect, car, road, traffic });

    return this;
  }

  private animate(sceneInfo: {
    ctx: CanvasRenderingContext2D;
    rect: Rect;
    traffic: Car[];
    road: RoadHorizontal;
    car: Car;
  }): void {
    const { ctx, road, traffic, car, rect } = sceneInfo;
    for (let i = 0; i < traffic.length; i++) {
      traffic[i].update(road.borders, []);
    }
    car.update(road.borders, traffic);

    // canvas.height = window.innerHeight;
    ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    ctx.save();
    // ctx.translate(0, -car.y + rect.height * 0.7);
    // ctx.translate(-car.xPos + rect.width * 0.7, 0);
    ctx.translate(-car.x + car.width * 1.5, 0);

    road.draw(ctx);

    for (let i = 0; i < traffic.length; i++) {
      traffic[i].draw(ctx, 'red');
    }
    car.draw(ctx, 'blue');

    ctx.restore();
    requestAnimationFrame(() => this.animate(sceneInfo));
  }
}
