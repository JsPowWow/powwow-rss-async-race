import type { Point, Polygon, Rect } from '@/geometry';
import { Rectangle, polysIntersect } from '@/geometry';

import type { ControlType } from './Controls.js';
import { Controls } from './Controls.js';
import { Sensor } from './Sensor.js';
import type { PolyShape } from './types.ts';

export class Car implements PolyShape {
  private readonly bounds: Rect;

  private speed: number;

  private readonly acceleration: number;

  private readonly maxSpeed: number;

  private readonly friction: number;

  private carAngle: number;

  private damaged: boolean;

  private readonly sensor?: Sensor;

  private readonly controls: Controls;

  private polygon: Polygon;

  constructor(x: number, y: number, width: number, height: number, controlType: ControlType, maxSpeed = 3) {
    this.bounds = new Rectangle(x, y, width, height);

    this.speed = 0;
    this.acceleration = 0.2;
    this.maxSpeed = maxSpeed;
    this.friction = 0.05;
    this.carAngle = -Math.PI / 2;
    this.damaged = false;

    if (controlType !== 'SELF') {
      this.sensor = new Sensor(this);
    }
    this.controls = new Controls(controlType);
    this.polygon = this.createPolygon();
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
      this.damaged = this.assessDamage(roadBorders, traffic);
    }
    if (this.sensor) {
      this.sensor.update(roadBorders, traffic);
    }
  }

  public draw(ctx: CanvasRenderingContext2D, color: CanvasFillStrokeStyles['fillStyle']): void {
    if (this.damaged) {
      ctx.fillStyle = 'gray';
    } else {
      ctx.fillStyle = color;
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
    const rad = Math.hypot(this.bounds.width, this.bounds.height) / 2;
    const alpha = Math.atan2(this.bounds.width, this.bounds.height);
    points.push({
      x: this.bounds.x - Math.sin(this.carAngle - alpha) * rad,
      y: this.bounds.y - Math.cos(this.carAngle - alpha) * rad,
    });
    points.push({
      x: this.bounds.x - Math.sin(this.carAngle + alpha) * rad,
      y: this.bounds.y - Math.cos(this.carAngle + alpha) * rad,
    });
    points.push({
      x: this.bounds.x - Math.sin(Math.PI + this.carAngle - alpha) * rad,
      y: this.bounds.y - Math.cos(Math.PI + this.carAngle - alpha) * rad,
    });
    points.push({
      x: this.bounds.x - Math.sin(Math.PI + this.carAngle + alpha) * rad,
      y: this.bounds.y - Math.cos(Math.PI + this.carAngle + alpha) * rad,
    });
    return points;
  }

  private move(): void {
    if (this.controls.moveForward) {
      this.speed += this.acceleration;
    }
    if (this.controls.moveReverse) {
      this.speed -= this.acceleration;
    }

    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    }
    if (this.speed < -this.maxSpeed / 2) {
      this.speed = -this.maxSpeed / 2;
    }

    if (this.speed > 0) {
      this.speed -= this.friction;
    }
    if (this.speed < 0) {
      this.speed += this.friction;
    }
    if (Math.abs(this.speed) < this.friction) {
      this.speed = 0;
    }

    if (this.speed !== 0) {
      const flip = this.speed > 0 ? 1 : -1;
      if (this.controls.moveLeft) {
        this.carAngle += 0.03 * flip;
      }
      if (this.controls.moveRight) {
        this.carAngle -= 0.03 * flip;
      }
    }

    this.bounds.x -= Math.sin(this.carAngle) * this.speed;
    this.bounds.y -= Math.cos(this.carAngle) * this.speed;
  }
}