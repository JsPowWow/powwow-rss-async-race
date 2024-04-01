import { type Point, lerp } from '@/geometry';

export type RoadHorizontalInput = {
  y: number;
  height: number;
  laneCount: number;
  endPos?: number;
  skin?: {
    img?: HTMLImageElement;
  };
};

export class RoadHorizontal {
  public readonly height: number;

  private readonly laneCount: number;

  private readonly left: number;

  private readonly right: number;

  private readonly top: number;

  private readonly bottom: number;

  private readonly skin?: HTMLImageElement;

  public readonly borders: Point[][];

  constructor(args: RoadHorizontalInput) {
    const { y, height, laneCount = 3 } = args;
    const infinity = 1000000;

    this.height = height;
    this.laneCount = laneCount;

    this.left = -infinity;
    this.right = infinity;

    this.top = y - height / 2;
    this.bottom = y + height / 2;

    this.skin = args.skin?.img;
    const topLeft = { x: this.left, y: this.top };
    const topRight = { x: this.right, y: this.top };
    const bottomLeft = { x: this.left, y: this.bottom };
    const bottomRight = { x: this.right, y: this.bottom };

    this.borders = [
      [topLeft, topRight],
      [bottomLeft, bottomRight],
    ];
  }

  public getLaneSize(): number {
    return this.height / this.laneCount;
  }

  public getLaneCenter(laneIndex: number): number {
    const laneSize = this.getLaneSize();
    return this.top + laneSize / 2 + Math.min(laneIndex, this.laneCount - 1) * laneSize;
  }

  public setFinishBorderPos(pos: number): void {
    this.borders[2] = [
      { x: pos, y: this.top },
      { x: pos, y: this.bottom },
    ];
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.skin) {
      const pattern = ctx.createPattern(this.skin, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, this.top - 10, this.right, this.bottom); // context.fillRect(x, y, width, height);
      }
    }

    ctx.lineWidth = 5;
    ctx.strokeStyle = 'white';

    for (let i = 1; i <= this.laneCount - 1; i += 1) {
      const y = lerp(this.top, this.bottom, i / this.laneCount);

      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(this.left, y);
      ctx.lineTo(this.right, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    const b = [];
    b.push(this.borders[0]);
    b.push(this.borders[1]);

    b.forEach((border) => {
      ctx.beginPath();
      ctx.moveTo(border[0].x, border[0].y);
      ctx.lineTo(border[1].x, border[1].y);
      ctx.stroke();
    });
  }
}
