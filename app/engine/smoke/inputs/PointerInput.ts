import type { RGBColor } from '../colorUtils.ts';
import type { FluidEffect } from '../FluidEffect.ts';
import { Pointer } from '../Pointer.ts';

export class PointerInput {
  constructor(
    public readonly effect: FluidEffect,
    public readonly id: number,
  ) {}

  public initialize(): typeof this {
    return this;
  }

  public doEffect(posX: number, posY: number, color?: RGBColor): void {
    let pointer = this.effect.findPointer(this.id);
    if (!pointer) {
      pointer = this.effect.addPointer(new Pointer(this.id));
    }

    if (!pointer.down) {
      this.effect.updatePointerDownData(pointer, this.id, posX, posY, color);
    }

    this.effect.updatePointerMoveData(pointer, posX, posY, color);
  }
}
