import type { Rect, Size } from '@/geometry';
import { assertIsNonNullable } from '@/utils';

import type { ComponentCreateOptions } from './Component';
import { Component } from './Component';

export type UseCanvasContext = { ctx: CanvasRenderingContext2D; canvas: HTMLCanvasElement };

export class CanvasComponent extends Component<'canvas'> {
  constructor(canvasElement?: HTMLElementTagNameMap['canvas'], options?: ComponentCreateOptions<'canvas'>) {
    super(canvasElement ?? 'canvas', options);
  }

  public static withUseCanvasContext2D(
    canvas: CanvasComponent,
  ): (callback: (context: UseCanvasContext) => void) => void {
    const ctx = canvas.element.getContext('2d');
    assertIsNonNullable(ctx, "canvas.getContext('2d')");

    return (callback: (context: UseCanvasContext) => void): void => {
      callback({ ctx, canvas: canvas.element });
    };
  }

  public static drawFromImage(
    ctx: CanvasRenderingContext2D,
    source: CanvasImageSource,
    canvasRect: Rect,
    imageRect: Rect,
  ): void {
    ctx.drawImage(
      source,
      imageRect.x,
      imageRect.y,
      imageRect.width,
      imageRect.height,
      0,
      0,
      canvasRect.width,
      canvasRect.height,
    );
  }

  public static applyShadow(ctx: CanvasRenderingContext2D, color: string, offsetY?: number): void {
    ctx.shadowColor = color;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    const depth = 3;
    if (offsetY) {
      ctx.shadowOffsetY = offsetY;
    }
    for (let i = 0; i < depth; i += 1) {
      for (let j = 0; j < depth; j += 1) {
        ctx.shadowBlur = depth + 1 + i;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  public setSize(size: Size): typeof this {
    this.nodeElement.width = size.width;
    this.nodeElement.height = size.height;

    return this;
  }
}
