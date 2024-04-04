import type { FluidEffect } from '../FluidEffect.ts';
import { Pointer } from '../Pointer.ts';
import { scaleByPixelRatio } from '../utils.ts';

export class MouseMoveInput {
  constructor(
    public readonly effect: FluidEffect,
    public readonly id: number,
  ) {}

  public initialize(): typeof this {
    this.effect.canvas.addEventListener('mousedown', (e) => {
      const posX = scaleByPixelRatio(e.offsetX);
      const posY = scaleByPixelRatio(e.offsetY);
      let pointer = this.effect.findPointer(this.id);
      if (!pointer) {
        pointer = this.effect.addPointer(new Pointer(this.id));
      }
      this.effect.updatePointerDownData(pointer, this.id, posX, posY);
    });

    this.effect.canvas.addEventListener('mousemove', (e) => {
      const pointer = this.effect.findPointer(this.id);
      if (!pointer || !pointer.down) {
        return;
      }

      const posX = scaleByPixelRatio(e.offsetX);
      const posY = scaleByPixelRatio(e.offsetY);
      this.effect.updatePointerMoveData(pointer, posX, posY);
    });

    window.addEventListener('mouseup', () => {
      const pointer = this.effect.findPointer(this.id);
      if (pointer) {
        this.effect.updatePointerUpData(pointer);
      }
    });
    return this;
  }
}
