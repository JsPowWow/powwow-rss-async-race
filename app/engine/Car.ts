import type { Point, Polygon, Rect } from '@/geometry';
import { Rectangle, polysIntersect } from '@/geometry';
import { assertIsNonNullable } from '@/utils';

import type { ControlType } from './Controls.js';
import { Controls } from './Controls.js';
import { Sensor } from './Sensor.js';
import type { PolyShape } from './types.ts';

export type CarInput = {
  x: number;
  y: number;
  width: number;
  height: number;
  controlType: ControlType;
  startAngle?: number;
  name?: string;
  speed?: number;
  color?: CanvasFillStrokeStyles['fillStyle'];
  skin?: {
    img?: HTMLImageElement;
  };
};

export const LOCAL_SPEED = 0.056916355582932183;

export class Car implements PolyShape {
  private readonly bounds: Rect;

  private readonly color: CanvasFillStrokeStyles['fillStyle'];

  public readonly name: string;

  private _speed: number;

  private readonly acceleration: number;

  private maxSpeed: number;

  private readonly friction: number;

  private carAngle: number;

  private damaged: boolean;

  private readonly sensor?: Sensor;

  private readonly controls: Controls;

  private polygon: Polygon;

  private readonly mask?: HTMLCanvasElement;

  private readonly img?: HTMLImageElement;

  constructor(args: CarInput) {
    const { x, y, width, height, controlType, speed = 0, color = 'yellow', name = '', startAngle = 0 } = args;
    this.name = name;
    this.bounds = new Rectangle(x, y, width, height);

    this.color = color;
    if (args.skin?.img) {
      try {
        this.img = args.skin?.img;

        this.mask = document.createElement('canvas');
        this.mask.width = width;
        this.mask.height = height;

        const maskCtx = this.mask.getContext('2d');
        assertIsNonNullable(maskCtx);

        assertIsNonNullable(this.img);
        maskCtx.fillStyle = color;
        maskCtx.rect(0, 0, this.width, this.height);
        maskCtx.fill();

        maskCtx.globalCompositeOperation = 'destination-atop';
        maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
      } catch (e) {
        // Nothing atm
      }
    }

    this._speed = 0;
    this.acceleration = 0.2;
    this.maxSpeed = speed;
    this.friction = 0.05;
    this.carAngle = startAngle;
    this.damaged = false;

    if (controlType !== 'SELF') {
      this.sensor = new Sensor(this);
    }
    this.controls = new Controls(controlType);
    this.polygon = this.createPolygon();
  }

  public setSpeed(speed: number): typeof this {
    this.maxSpeed = speed;
    return this;
  }

  public getPolygon(): Polygon {
    return this.polygon.concat();
  }

  public get x(): number {
    return this.bounds.x;
  }

  public get y(): number {
    return this.bounds.y;
  }

  public get width(): number {
    return this.bounds.width;
  }

  public get height(): number {
    return this.bounds.height;
  }

  public get angle(): number {
    return this.carAngle;
  }

  public update(roadBorders: Point[][], traffic: PolyShape[]): void {
    if (!this.damaged) {
      this.move();
      this.polygon = this.createPolygon();
      const prevD = this.damaged;
      this.damaged = this.assessDamage(roadBorders, traffic);
      if (!prevD && this.damaged) {
        // const endTime = performance.now();
        // const len = this.x - this.startX;
        // const time = endTime - this.startTime;
        // console.timeEnd(`car${this.name}`);
        // console.log(`$time ${time} len ${len} speed ${len / time}`);
        // console.log('pass ', len);
      }
    }
    if (this.sensor) {
      this.sensor.update(roadBorders, traffic);
    }
  }

  public draw(ctx: CanvasRenderingContext2D, options?: { drawSensor: boolean }): void {
    if (this.mask && this.img) {
      this.drawSkin(ctx, options);
      return;
    }

    if (this.damaged) {
      ctx.fillStyle = 'gray';
    } else {
      ctx.fillStyle = this.color;
    }
    ctx.beginPath();
    ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
    for (let i = 1; i < this.polygon.length; i++) {
      ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
    }
    ctx.fill();

    if (this.sensor) {
      this.sensor.draw(ctx);
    }
  }

  private drawSkin(ctx: CanvasRenderingContext2D, options?: { drawSensor: boolean }): void {
    if (this.sensor && options?.drawSensor) {
      this.sensor.draw(ctx);
    }

    ctx.save();

    try {
      assertIsNonNullable(this.mask);
      assertIsNonNullable(this.img);
      ctx.translate(this.x, this.y);
      ctx.rotate(-this.angle);
      if (!this.damaged || !this.sensor) {
        ctx.drawImage(this.mask, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.globalCompositeOperation = 'multiply';
      }
      ctx.drawImage(this.img, -this.width / 2, -this.height / 2, this.width, this.height);
    } catch (_e) {
      // nothing
    } finally {
      ctx.restore();
    }
  }

  private assessDamage(roadBorders: Point[][], traffic: PolyShape[]): boolean {
    for (let i = 0; i < roadBorders.length; i += 1) {
      if (polysIntersect(this.polygon, roadBorders[i])) {
        return true;
      }
    }
    for (let i = 0; i < traffic.length; i++) {
      if (polysIntersect(this.polygon, traffic[i].getPolygon())) {
        return true;
      }
    }
    return false;
  }

  private createPolygon(): Polygon {
    const points = [];
    const { bounds } = this;
    const rad = Math.hypot(bounds.width, bounds.height) / 2;
    const alpha = Math.atan2(bounds.width, bounds.height);
    points.push({
      x: bounds.x - Math.sin(this.carAngle - alpha) * rad,
      y: bounds.y - Math.cos(this.carAngle - alpha) * rad,
    });
    points.push({
      x: bounds.x - Math.sin(this.carAngle + alpha) * rad,
      y: bounds.y - Math.cos(this.carAngle + alpha) * rad,
    });
    points.push({
      x: bounds.x - Math.sin(Math.PI + this.carAngle - alpha) * rad,
      y: bounds.y - Math.cos(Math.PI + this.carAngle - alpha) * rad,
    });
    points.push({
      x: bounds.x - Math.sin(Math.PI + this.carAngle + alpha) * rad,
      y: bounds.y - Math.cos(Math.PI + this.carAngle + alpha) * rad,
    });
    return points;
  }

  private move(): void {
    if (this.controls.moveForward) {
      this._speed += this.acceleration;
    }
    if (this.controls.moveReverse) {
      this._speed -= this.acceleration;
    }

    if (this._speed > this.maxSpeed) {
      this._speed = this.maxSpeed;
    }
    if (this._speed < -this.maxSpeed / 2) {
      this._speed = -this.maxSpeed / 2;
    }

    if (this._speed > 0) {
      this._speed -= this.friction;
    }
    if (this._speed < 0) {
      this._speed += this.friction;
    }
    if (Math.abs(this._speed) < this.friction) {
      this._speed = 0;
    }

    if (this._speed !== 0) {
      const flip = this._speed > 0 ? 1 : -1;
      if (this.controls.moveLeft) {
        this.carAngle += 0.03 * flip;
      }
      if (this.controls.moveRight) {
        this.carAngle -= 0.03 * flip;
      }
    }

    this.bounds.x -= Math.sin(this.carAngle) * this._speed;
    this.bounds.y -= Math.cos(this.carAngle) * this._speed;
  }
}
