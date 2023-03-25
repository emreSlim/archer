import { Img, CanvasComponent, TransNumber } from "..";

export class Blood extends CanvasComponent {
  static HEADSHOT = new Img("shot.png").image;
  static BODYSHOT = new Img("headshot.png").image;

  hx = 0;
  hy = 0;
  hw: number;
  hh: number;
  w = 100;
  h = 100;

  opacity = new TransNumber(0);
  showHeadshot = false;
  constructor(w: number, h: number) {
    super();
    this.hidden = true;
    this.hw = w;
    this.hh = h;
  }

  show(x: number, y: number, headshot: boolean) {
    this.opacity.setVal(0.5, 0.1);
    this.x = x - this.w / 2;
    this.y = y - this.h / 2;

    if (headshot) {
      this.showHeadshot = true;
    }

    this.hidden = false;
    setTimeout(() => {
      this.opacity.setVal(0, 1, () => {
        this.hidden = true;
        this.showHeadshot = false;
      });
    }, 2000);
  }

  protected _draw(ctx: CanvasRenderingContext2D, elapsedTime: number): void {
    this.opacity.tick(elapsedTime);
    ctx.globalAlpha = this.opacity.currentVal;
    ctx.drawImage(Blood.BODYSHOT, this.x, this.y, this.w, this.h);
    if (this.showHeadshot) {
      ctx.resetTransform();
      ctx.drawImage(Blood.HEADSHOT, this.hx, this.hy, this.hw, this.hh);
    }
  }
  doesPointIntercept(x: number, y: number): boolean {
    throw new Error("Method not implemented.");
  }
}
