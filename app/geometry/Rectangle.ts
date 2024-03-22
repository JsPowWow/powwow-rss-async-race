import type { Point, Rect, ScaleRatio, Size } from './types';

export class Rectangle<Owner> implements Rect {
  public x = 0;

  public y = 0;

  public width = 0;

  public height = 0;

  private readonly rectOwner: Owner | undefined;

  public static copyOf<Own>(srcRect: Rect, owner?: Own): Rectangle<Own> {
    return new Rectangle<Own>(srcRect.x, srcRect.y, srcRect.width, srcRect.height, owner);
  }

  public static from<Own>(topLeft: Point, size: Size, owner?: Own): Rectangle<Own> {
    return new Rectangle(topLeft.x, topLeft.y, size.width, size.height, owner);
  }

  constructor(x = 0, y = 0, width = 0, height = 0, owner?: Owner) {
    this.rectOwner = owner;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public get owner(): typeof this.rectOwner {
    return this.rectOwner;
  }

  public move(x: number, y: number): typeof this {
    this.x = x;
    this.y = y;
    return this;
  }

  public resize(width: number, height: number): typeof this {
    this.width = width;
    this.height = height;
    return this;
  }

  public scale({ scaleX, scaleY }: ScaleRatio): typeof this {
    this.x *= scaleX;
    this.width *= scaleX;
    this.y *= scaleY;
    this.height *= scaleY;
    return this;
  }

  public round(): typeof this {
    this.x = Math.round(this.x);
    this.width = Math.round(this.width);
    this.y = Math.round(this.y);
    this.height = Math.round(this.height);
    return this;
  }

  public clone(): Rectangle<Owner>;
  public clone<Own>(owner: Own): Rectangle<Own>;
  public clone<Own extends Owner>(owner?: Own): Rectangle<Own | Owner> {
    return new Rectangle(this.x, this.y, this.width, this.height, owner ?? this.owner);
  }

  public update(options: Partial<{ xBy: number; widthBy: number; yBy: number; heightBy: number }>): typeof this {
    const { widthBy = 0, heightBy = 0, xBy = 0, yBy = 0 } = options ?? Object.create(null);
    if (xBy) {
      this.x += xBy;
    }
    if (yBy) {
      this.y += yBy;
    }
    if (widthBy) {
      this.width += widthBy;
    }
    if (heightBy) {
      this.height += heightBy;
    }

    return this;
  }
}
