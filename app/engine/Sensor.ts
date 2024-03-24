import type { Intersection, Point } from '@/geometry';
import { getIntersection, lerp } from '@/geometry';

import type { PolyShape } from './types.ts';

export function getReading(ray: Point[], roadBorders: Point[][], traffic: PolyShape[]): Intersection {
  const touches = [];

  for (let i = 0; i < roadBorders.length; i++) {
    const touch = getIntersection(ray[0], ray[1], roadBorders[i][0], roadBorders[i][1]);
    if (touch) {
      touches.push(touch);
    }
  }

  for (let i = 0; i < traffic.length; i++) {
    const poly = traffic[i].getPolygon();
    for (let j = 0; j < poly.length; j++) {
      const value = getIntersection(ray[0], ray[1], poly[j], poly[(j + 1) % poly.length]);
      if (value) {
        touches.push(value);
      }
    }
  }

  if (touches.length === 0) {
    return undefined;
  }
  const offsets = touches.map((e) => e.offset);
  const minOffset = Math.min(...offsets);
  return touches.find((e) => e.offset === minOffset);
}

export class Sensor {
  private readonly owner: PolyShape;

  private readonly rayCount: number;

  private readonly rayLength: number;

  private readonly raySpread: number;

  private rays: Point[][];

  private readings: Intersection[];

  constructor(owner: PolyShape) {
    this.owner = owner;
    this.rayCount = 5;
    this.rayLength = 150;
    this.raySpread = Math.PI / 2;

    this.rays = [];
    this.readings = [];
  }

  public update(roadBorders: Point[][], traffic: PolyShape[]): void {
    this.castRays();
    this.readings = [];
    for (let i = 0; i < this.rays.length; i++) {
      this.readings.push(getReading(this.rays[i], roadBorders, traffic));
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.rayCount; i++) {
      let end: Point | undefined = this.rays[i][1];
      if (this.readings[i]) {
        end = this.readings[i];
      }
      if (!end) {
        return;
      }

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'yellow';
      ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.moveTo(this.rays[i][1].x, this.rays[i][1].y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }

  private castRays(): void {
    this.rays = [];
    for (let i = 0; i < this.rayCount; i++) {
      const rayAngle =
        lerp(this.raySpread / 2, -this.raySpread / 2, this.rayCount === 1 ? 0.5 : i / (this.rayCount - 1)) +
        this.owner.angle;

      const start = { x: this.owner.x, y: this.owner.y };
      const end = {
        x: this.owner.x - Math.sin(rayAngle) * this.rayLength,
        y: this.owner.y - Math.cos(rayAngle) * this.rayLength,
      };
      this.rays.push([start, end]);
    }
  }
}
