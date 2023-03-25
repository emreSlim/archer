import { Img } from "..";

export abstract class LeafAbstract {
  x = 0;
  y = 0;
  angle = 0;
  vx = 0;
  vy = 0;
  va = 0;
  isMoving = false;
  offsetW: number;
  offsetH: number;
  offsetAngle: number;
  w: number;
  h: number;
  image: HTMLImageElement;
  hidden = false;
  scale = 1;
  constructor(
    name: string,
    w: number,
    h: number,
    offsetW: number,
    offsetH: number,
    offsetAngle: number
  ) {
    this.image = new Img(name).image;
    this.w = w;
    this.h = h;
    this.offsetW = offsetW;
    this.offsetH = offsetH;
    this.offsetAngle = offsetAngle;
  }

  draw(ctx: CanvasRenderingContext2D, elapsedTime: number) {
    if (this.hidden) {
      return;
    }
    if (this.isMoving) {
      this.updateState(elapsedTime);
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + this.offsetAngle);
    ctx.translate(-this.x, -this.y);
    ctx.drawImage(
      this.image,
      this.x + this.offsetW * this.scale,
      this.y + this.offsetH * this.scale,
      this.w * this.scale,
      this.h * this.scale
    );
    ctx.restore();
  }

  updateState(passedTime: number) {
    this.x += passedTime * this.vx;
    this.y += passedTime * this.vy;
    this.angle += passedTime * this.va;
  }

  isOutOfFrame(w: number, h: number) {
    return this.x < 0 || this.y < 0 || this.x > w || this.y > h;
  }

  setAir(vx: number, vy: number) {
    if (vx || vy) {
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }
    this.vx = vx;
    this.vy = vy;
    this.va =
      ((Math.random() - 0.5) * Math.max(Math.abs(vx), Math.abs(vy))) / 20;
  }
}
