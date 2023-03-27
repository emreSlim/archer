import { Archerman, Arrow, Number2D, TransNumber2D } from "../";
import { Img, Sound } from "../../assets";
import { Vector } from "../../helpers/Science";

export class Bird {
  static IMG = new Img("bird.png").image;
  static W = 40;
  static H = 32;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  ax = 0;
  ay = 0;
  flapSpeed = 2;
  /** stuck arrow */
  arrow: Arrow | undefined;
  /** arrow angle offset */
  arrowAngleO = 0;
  /** arrow stick angle offset */
  // arrowHitAngleO = 0;
  /** arrow distance */
  // arrowDist = 0;

  facingRight = true;
  angle = 0;
  angleVelocity = 0; // tbd

  timeout:NodeJS.Timeout|undefined

  static hitSound = new Sound("bird-hit.m4a");
  isAlive = true;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }


  private i = 0;
  private sw = 187;
  private sh = 146;

  draw(ctx: CanvasRenderingContext2D, elapsedTime: number): void {
    this.tick(elapsedTime); // move
    ctx.save();
    if (!this.facingRight) {
      ctx.translate(this.x - Bird.W / 2, this.y);
      ctx.scale(-1, 1);
      ctx.translate(-(Bird.W + this.x - Bird.W / 2), -this.y);
    }

    if (this.angle) {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle * (this.facingRight ? 1 : -1));
      ctx.translate(-this.x, -this.y);
    }

    ctx.drawImage(
      Bird.IMG,
      this.sw * Math.floor((this.i / 10) % 8),
      this.i >= 80 ? this.sh : 0,
      this.sw,
      this.sh,
      this.x - Bird.W / 2,
      this.y - Bird.H / 2,
      Bird.W,
      Bird.H
    );
    if (this.isAlive) {
      this.i += this.flapSpeed;
      if (this.i >= 160) {
        this.i = 0;
      }
    }
    ctx.restore();
  }

  hitArrow = (a: Arrow) => {
    this.isAlive = false;
    this.ay = a.ay;
    this.ax = a.ax;

    a.ax = 0;
    a.ay = 0;
    a.vx = 0;
    a.vy = 0;
    // this.arrowDist = 0; //Vector.distance(a.x, a.y, this.x, this.y);

    this.arrowAngleO = a.angle - this.angle;
    // this.arrowHitAngleO = 0; // Vector.getAngle(a.x - this.x, a.y - this.y);
    this.angleVelocity = 10;
    this.arrow = a;
  };

  tick = (elapsedTime: number) => {
    if (this.vx) this.x += this.vx * elapsedTime;
    if (this.vy) this.y += this.vy * elapsedTime;
    if (this.ax) this.vx += this.ax * elapsedTime;
    if (this.ay) this.vy += this.ay * elapsedTime;
    if (this.angleVelocity) this.angle += this.angleVelocity * elapsedTime;

    if (this.arrow) {
      this.arrow.x = this.x; //+ Vector.dx(this.arrowDist, this.arrowHitAngleO + this.angle);
      this.arrow.y = this.y; //+ Vector.dy(this.arrowDist, this.arrowHitAngleO + this.angle);
      this.arrow.angle = this.angle + this.arrowAngleO;
    }
  };

  fly = (p1: Number2D, p2: Number2D, timeInterval: number) => {
    this.x = p1.x;
    this.y = p1.y;

    const dist = Vector.distance(p1.x, p1.y, p2.x, p2.y);
    this.isAlive = true;

    this.facingRight = p1.x < p2.x;

    this.arrow = undefined;
    this.ax = 0;
    this.ay = 0;
    this.angleVelocity = 0;
    this.angle = 0;
    this.flapSpeed = dist / (timeInterval * 8);
    this.vx = (p2.x - p1.x) / timeInterval;
    this.vy = (p2.y - p1.y) / timeInterval;
  };

  isBird = (imageData: Uint8ClampedArray) => {
    return imageData[0] === 0 && imageData[1] === 0 && imageData[2] === 3; //explicitly color set for bird
  };

  doesArrowHit = (a: Arrow, main: Archerman) => {
    if (
      a.x + a.arrLen / 2 < this.x - Bird.W / 2 ||
      a.y + a.arrLen / 2 < this.y - Bird.H / 2 ||
      a.x > this.x + Bird.W / 2 + a.arrLen / 2 ||
      a.y > this.y + Bird.H / 2 + a.arrLen / 2
    ) {
      return false;
    }

    let x = a.x + Vector.dx(a.arrLen / 2 - 5, a.angle),
      y = a.y + Vector.dy(a.arrLen / 2 - 5, a.angle);

    if (
      this.isBird(main.getImageData(x, y, 1, 1)) ||
      this.isBird(main.getImageData(a.x, a.y, 1, 1))
    ) {
      return true;
    }

    return false;
  };
}
