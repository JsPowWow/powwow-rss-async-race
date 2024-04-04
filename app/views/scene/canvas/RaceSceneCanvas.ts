import type { Component } from '@/components';
import { CanvasComponent } from '@/components';
import type { Car } from '@/engine';
import { FluidEffect, PointerInput } from '@/engine';
import type { AnyVoidFunction } from '@/utils';
import { randomInt } from '@/utils';

import classes from './RaceSceneCanvas.module.css';
import type { Traffic } from '../models/Traffic.ts';
import { TrafficCar } from '../models/TrafficCar.ts';

const loopAnimation = (cb: AnyVoidFunction, step?: number): void => {
  let start = performance.now();
  const freq = step ?? 0;
  requestAnimationFrame(function measure(time) {
    const elapsed = time - start;
    if (elapsed >= freq) {
      start = time;
      cb();
    }

    requestAnimationFrame(measure);
  });
};

export class RaceSceneCanvas extends CanvasComponent {
  private readonly smokeCanvas: Component<'canvas'>;

  private smoke: FluidEffect;

  private smokeInput: WeakMap<Car, PointerInput> = new WeakMap();

  constructor(smokeCanvas: Component<'canvas'>) {
    super(undefined, { id: 'race-canvas' });
    this.smokeCanvas = smokeCanvas;
    this.smoke = new FluidEffect(this.smokeCanvas.element);
    this.toggleClass(classes.sceneCanvas);
  }

  public draw(traffic: Traffic): typeof this {
    const { smoke } = this;
    // new MouseMoveInput(smoke, 42).initialize();
    this.smokeInput.set(traffic.getHeroCar(), new PointerInput(smoke, 100).initialize());
    traffic.cars().forEach((c) => this.smokeInput.set(c.car, new PointerInput(smoke, c.id).initialize()));

    CanvasComponent.withUseCanvasContext2D(this)(({ ctx }) => {
      this.smokeCanvas.element.width = this.width;
      this.smokeCanvas.element.height = this.height;
      loopAnimation(() => this.drawTrafficCanvas(ctx, traffic));
    });

    loopAnimation(() => {
      const spread = 2;
      const hero = traffic.getHeroCar();

      if (hero.isDamaged) {
        const back = hero.getBack();
        this.smokeInput
          .get(hero)
          ?.doEffect(randomInt(back.x - spread, back.x + spread), randomInt(back.y - spread / 2, back.y + spread / 2), {
            r: 255,
            g: 128,
            b: 0,
          });
      }

      traffic
        .cars()
        .concat([])
        .filter((c) => c.state.state === 'error')
        .forEach((c) => {
          const back = c.car.getBack();
          this.smokeInput
            .get(c.car)
            ?.doEffect(
              randomInt(back.x - spread, back.x + spread),
              randomInt(back.y - spread / 2, back.y + spread / 2),
              {
                r: 255,
                g: 128,
                b: 0,
              },
            );
        });
    }, 130);

    return this;
  }

  private drawTrafficCanvas(ctx: CanvasRenderingContext2D, traffic: Traffic): void {
    this.smoke.update();

    const trafficCars = traffic.cars().map(TrafficCar.toPaintCar);
    const trafficRoad = traffic.getRoad();

    traffic.cars().forEach((c) => {
      c.car.update(trafficRoad.borders, []);
      if (c.car.currentSpeed > 0) {
        c.car.getPassPath().forEach((p) => {
          this.smokeInput.get(c.car)?.doEffect(p.x, p.y, { r: 32, g: 32, b: 32 });
        });
      }
    });

    const hero = traffic.getHeroCar();
    hero.update(trafficRoad.borders, trafficCars);
    if (hero.currentSpeed > 0) {
      hero.getPassPath().forEach((p) => {
        this.smokeInput.get(hero)?.doEffect(p.x, p.y, { r: 32, g: 32, b: 32 });
      });
    }

    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();

    // TODO camera to follow "hero"1
    // ctx.translate(0, -hero.y + trafficRoad.height - 15);
    // ctx.translate(-hero.x + this.width * 0.7, 0);
    // ctx.translate(-hero.x + hero.width * 1.5, 0);

    // TODO camera to follow "hero"2
    // ctx.translate(0, -hero.y + trafficRoad.height - 15);
    // ctx.translate(-hero.x + hero.width * 5.5, 0);

    trafficRoad.draw(ctx);

    for (let i = 0; i < trafficCars.length; i++) {
      trafficCars[i].draw(ctx);
    }
    hero.draw(ctx);

    ctx.globalCompositeOperation = 'lighten';
    ctx.drawImage(this.smokeCanvas.element, 0, 0, this.smokeCanvas.element.width, this.smokeCanvas.element.height);

    ctx.restore();
    // return requestAnimationFrame(() => this.drawTrafficCanvas(ctx, traffic));
  }

  public override destroy(): void {
    super.destroy();
  }
}
