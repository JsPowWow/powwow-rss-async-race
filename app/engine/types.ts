import type { Polygon, Rect } from '@/geometry';

export interface PolyShape extends Rect {
  getPolygon(): Polygon;
  get angle(): number;
  get x(): number;
  get y(): number;
  get width(): number;
  get height(): number;
}
