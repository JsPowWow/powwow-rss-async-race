import type { ScaleRatio, Size } from './types';

export class Dimension<Owner = unknown> implements Size {
  public width = 0;

  public height = 0;

  private readonly dimensionOwner: Owner | undefined;

  public static isSize(value: unknown): value is Size {
    return Boolean(
      value &&
        typeof value === 'object' &&
        'width' in value &&
        typeof value.width === 'number' &&
        value &&
        typeof value === 'object' &&
        'height' in value &&
        typeof value.height === 'number',
    );
  }

  public static from<Owner>(src: Size, owner?: Owner): Dimension {
    return new Dimension<Owner>(src.width, src.height, owner);
  }

  constructor(width: number, height: number, owner?: Owner) {
    this.dimensionOwner = owner;
    this.width = width;
    this.height = height;
  }

  public get owner(): typeof this.dimensionOwner {
    return this.dimensionOwner;
  }

  public resizeWidthBy(dWidth: number): typeof this {
    this.width += dWidth;
    return this;
  }

  public resizeHeightBy(dHeight: number): typeof this {
    this.height += dHeight;
    return this;
  }

  public clone(): Dimension<Owner> {
    return new Dimension<Owner>(this.width, this.height, this.owner);
  }

  public scaleBy(widthBy: number, heightBy: number): typeof this {
    this.width /= widthBy;
    this.height /= heightBy;
    return this;
  }

  public scale({ scaleX, scaleY }: ScaleRatio): typeof this {
    this.width *= scaleX;
    this.height *= scaleY;
    return this;
  }
}
