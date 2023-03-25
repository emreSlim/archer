import { CanvasComponent } from "..";

export class PowerIndicator extends CanvasComponent {
  value = 0;
  static w = 5;
  static h = 200;
  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }

  protected _draw(ctx: CanvasRenderingContext2D, elapsedTime: number): void {
    ctx.resetTransform();
    ctx.fillStyle = "#000";
    ctx.fillRect(this.x, this.y, PowerIndicator.w, PowerIndicator.h);
    ctx.fillStyle = `hsl(${100 - this.value * 100},100%,50%)`;
    ctx.fillRect(
      this.x + 1,
      this.y + 1 + (PowerIndicator.h - 2) * (1 - this.value),
      PowerIndicator.w - 2,
      (PowerIndicator.h - 2) * this.value
    );
  }
  doesPointIntercept(x: number, y: number): boolean {
    return false;
  }
}
