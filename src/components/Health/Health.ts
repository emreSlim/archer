import { CanvasComponent, TransNumber } from "..";

export class Health extends CanvasComponent {
  canvasW: number;
  health = [new TransNumber(100), new TransNumber(100)];
  timer = [-1, -1];
  static TIMER_MAX = 30;
  static W = 128;
  static H = 8;
  /**
   * offset horizontal
   */
  static OH = 16;
  /**
   * offset vertical
   */
  static OV = 16;

  constructor(width: number) {
    super();
    this.x = 0;
    this.y = 0;
    this.canvasW = width;
  }

  resetHealth = () => {
    this.health.forEach((h) => h.setVal(100, 0));
  };

  resetTimers = () => {
    this.timer[0] = -1;
    this.timer[1] = -1;
  };

  protected _draw(ctx: CanvasRenderingContext2D, elapsedTime: number): void {
    this.health.forEach((h) => h.tick(elapsedTime));
    ctx.resetTransform();
    this.drawRect(
      ctx,
      Health.OH,
      Health.OV,
      this.health[0].currentVal,
      this.timer[0]
    );
    this.drawRect(
      ctx,
      this.canvasW - Health.OH - Health.W,
      Health.OV,
      this.health[1].currentVal,
      this.timer[1]
    );
  }

  private drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    health: number,
    timer: number
  ) {
    x += this.x;
    y += this.y;
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, Health.W, (timer > 0 ? 1.9 : 1) * Health.H);
    ctx.fillStyle = `hsl(${health},100%,50%)`;
    ctx.fillRect(x + 1, y + 1, (Health.W - 2) * (health / 100), Health.H - 2);

    if (timer > 0) {
      // ctx.fillStyle = timer < 10 ? "red" : "yellow";
      ctx.fillStyle = `hsl(${timer * 2},100%,50%)`;
      ctx.fillRect(
        x + 1,
        y + Health.H,
        (Health.W * timer) / Health.TIMER_MAX - 2,
        Health.H * 0.8
      );
    }
  }

  doesPointIntercept(x: number, y: number): boolean {
    return false;
  }
}
