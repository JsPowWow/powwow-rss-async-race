import type { Point, ScaleRatio } from './types';

export class Position<Owner = unknown> implements Point {
  public x = 0;

  public y = 0;

  private readonly pointOwner: Owner | undefined;

  public static from<Owner>(src: Point, owner?: Owner): Position {
    return new Position<Owner>(src.x, src.y, owner);
  }

  constructor(x = 0, y = 0, owner?: Owner) {
    this.pointOwner = owner;
    this.x = x;
    this.y = y;
  }

  public get owner(): typeof this.pointOwner {
    return this.pointOwner;
  }

  public moveX(x: number): typeof this {
    this.x = x;
    return this;
  }

  public moveY(y: number): typeof this {
    this.y = y;
    return this;
  }

  public move(x: number, y: number): typeof this {
    this.x = x;
    this.y = y;
    return this;
  }

  public moveBy(dX: number, dY: number): typeof this {
    this.x += dX;
    this.y += dY;
    return this;
  }

  public moveXBy(dX: number): typeof this {
    this.x += dX;
    return this;
  }

  public moveYBy(dY: number): typeof this {
    this.x = this.y + dY;
    return this;
  }

  public scale({ scaleX, scaleY }: Partial<ScaleRatio>): typeof this {
    if (scaleX) {
      this.x *= scaleX;
    }
    if (scaleY) {
      this.y *= scaleY;
    }
    return this;
  }

  public clone<O>(owner?: O): Position<O> {
    return new Position(this.x, this.y, owner);
  }

  public update(options: Partial<Point>): typeof this {
    this.x = options.x ?? this.x;
    this.y = options.y ?? this.y;
    return this;
  }
}
