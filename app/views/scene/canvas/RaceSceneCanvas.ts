import { CanvasComponent } from '@/components';

import classes from './RaceSceneCanvas.module.css';
import type { Traffic } from '../models/Traffic.ts';
import { TrafficCar } from '../models/TrafficCar.ts';

export class RaceSceneCanvas extends CanvasComponent {
  private rafHandle?: number;

  constructor() {
    super();
    this.toggleClass(classes.sceneCanvas);
  }

  public draw(traffic: Traffic): typeof this {
    CanvasComponent.withUseCanvasContext2D(this)(({ ctx }) => {
      this.rafHandle = this.animate(ctx, traffic);
    });

    return this;
  }

  private stopAnimate = (): void => {
    if (this.rafHandle) {
      cancelAnimationFrame(this.rafHandle);
    }
  };

  private animate(ctx: CanvasRenderingContext2D, traffic: Traffic): number {
    const trafficCars = traffic.cars().map(TrafficCar.toPaintCar);
    const trafficRoad = traffic.getRoad();
    const hero = traffic.getHeroCar();
    for (let i = 0; i < trafficCars.length; i++) {
      trafficCars[i].update(trafficRoad.borders, []);
    }
    hero.update(trafficRoad.borders, trafficCars);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();

    // TODO camera to follow "hero"
    // ctx.translate(0, -hero.y + trafficRoad.height - 15);
    // ctx.translate(-hero.x + this.width * 0.7, 0);
    // ctx.translate(-hero.x + hero.width * 1.5, 0);

    ctx.translate(0, -hero.y + trafficRoad.height - 15);
    ctx.translate(-hero.x + hero.width * 2.5, 0);

    trafficRoad.draw(ctx);

    for (let i = 0; i < trafficCars.length; i++) {
      trafficCars[i].draw(ctx);
    }
    hero.draw(ctx);

    ctx.restore();
    return requestAnimationFrame(() => this.animate(ctx, traffic));
  }

  public override destroy(): void {
    this.stopAnimate();
    super.destroy();
  }
}
