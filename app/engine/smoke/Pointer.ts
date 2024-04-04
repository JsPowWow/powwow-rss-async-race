import type { RGBColor } from './colorUtils.ts';

export class Pointer {
  public id;

  public texcoordX = 0;

  public texcoordY = 0;

  public prevTexcoordX = 0;

  public prevTexcoordY = 0;

  public deltaX = 0;

  public deltaY = 0;

  public down = false;

  public moved = false;

  public color: RGBColor = { r: 30, g: 0, b: 300 };

  constructor(id?: number) {
    this.id = id ?? -1;
  }
}
