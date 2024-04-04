import { Dimension } from './Dimension';
import { Position } from './Position';
import { Rectangle } from './Rectangle';
import type { Point, ScaleRatio, Size } from './types';

export const getElementBounds = <T extends Element>(element: T): Rectangle<T> => {
  const clientRect = element.getBoundingClientRect();
  return new Rectangle<T>(clientRect.left, clientRect.top, clientRect.width, clientRect.height, element);
};

export const getElementRelativeSize = <T extends HTMLElement>(element: T): Dimension<T> => {
  return new Dimension<T>(element.offsetWidth, element.offsetHeight, element);
};

export const getElementRelativeOffset = <T extends HTMLElement>(element: T): Position<T> => {
  return new Position<T>(element.offsetLeft, element.offsetTop, element);
};

export const getElementRelativeBounds = <T extends HTMLElement>(element: T): Rectangle<T> => {
  const pos = getElementRelativeOffset<T>(element);
  const size = getElementRelativeSize<T>(element);
  return new Rectangle(pos.x, pos.y, size.width, size.height, element);
};

export const toScaleRatio = (size: Size): ScaleRatio => {
  return { scaleX: size.width, scaleY: size.height };
};

export function lerp(A: number, B: number, t: number): number {
  return A + (B - A) * t;
}

export type Intersection = (Point & { offset: number }) | undefined;

export function getIntersection(A: Point, B: Point, C: Point, D: Point): Intersection {
  const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
  const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

  if (bottom !== 0) {
    const t = tTop / bottom;
    const u = uTop / bottom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: lerp(A.x, B.x, t),
        y: lerp(A.y, B.y, t),
        offset: t,
      };
    }
  }

  return undefined;
}

export type Polygon = Point[];

export function polysIntersect(poly1: Polygon, poly2: Polygon): boolean {
  for (let i = 0; i < poly1.length; i += 1) {
    for (let j = 0; j < poly2.length; j += 1) {
      const touch = getIntersection(poly1[i], poly1[(i + 1) % poly1.length], poly2[j], poly2[(j + 1) % poly2.length]);
      if (touch) {
        return true;
      }
    }
  }
  return false;
}

export function getMidPoint(p1: Point, p2: Point): Point {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}
