import { Motion, Vector } from "../../helpers/";
import { Img, TransNumber, CanvasComponent } from "../";

export class Arrow extends CanvasComponent {
  static IMG = new Img("arrow2_512.png").image;
  public arrLen = 37;
  private arrWid = 2;
  private imagesize = this.arrLen / Math.sqrt(2);

  x = innerWidth / 2;
  y = innerHeight / 2;
  angle = 0;
  vx = 0;
  vy = 0;
  ax = 0;
  ay = 0;
  isMoving = false;
  opacity = new TransNumber(1);

  /** x position of arrow head */
  get hx() {
    return this.x + Vector.dx(this.arrLen / 2, this.angle);
  }
  /** y position of arrow head */
  get hy() {
    return this.y + Vector.dy(this.arrLen / 2, this.angle);
  }
  /** x position of arrow tail */
  get tx() {
    return this.x - Vector.dx(this.arrLen * 0.4, this.angle);
  }
  /** y position of arrow tail */
  get ty() {
    return this.y - Vector.dy(this.arrLen * 0.4, this.angle);
  }

  doesPointIntercept(x: number, y: number): boolean {
    const slope = Math.tan(this.angle);
    return (
      Math.abs(y - Math.round(slope * (x - this.x) + this.y)) < this.arrWid &&
      !Vector.isDistGreater(this.x, this.y, x, y, this.arrLen / 2) //max distance from center point, cant be more than half arrow
    );
  }

  drawArrow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    elapsedTime: number
  ) => {
    this.updateState(elapsedTime);
    ctx.translate(x, y);
    ctx.rotate(Math.PI - Math.PI / 4 + angle);
    ctx.translate(-x, -y);
    ctx.drawImage(
      Arrow.IMG,
      x - this.imagesize / 2,
      y - this.imagesize / 2,
      this.imagesize,
      this.imagesize
    );
  };

  setOpacity = (opacity: number, animateDuration = 0,onEndCB=()=>{}) => {
    if(this.hidden && opacity) this.hidden = false;
    this.opacity.setVal(opacity, animateDuration, ()=>{
      if(opacity===0) this.hidden = true;
      onEndCB();
    });
  };


  updateState = (elapsedTime: number) => {
    if (!this.isMoving) return;
    this.vx = Motion.v(this.vx, this.ax, elapsedTime);
    this.vy = Motion.v(this.vy, this.ay, elapsedTime);
    this.x += Motion.s(this.vx, this.ax, elapsedTime);
    this.y += Motion.s(this.vy, this.ay, elapsedTime);
    this.angle = Vector.getAngle(this.vx, this.vy);
  };

  protected _draw(ctx: CanvasRenderingContext2D, elapsedTime: number): void {
    this.opacity.tick(elapsedTime);
    ctx.globalAlpha = this.opacity.currentVal;
    this.drawArrow(ctx, this.x, this.y, this.angle, elapsedTime);
  }

  isOutOfFrame = (w: number, h: number) => {
    return this.x < 0 || this.y < 0 || this.x > w || this.y > h;
  };

  doesHitLine(
    //readable code is commented below
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    lineLen?: number
  ) {
    if (lineLen == null) {
      lineLen = Vector.distance(x1, y1, x2, y2);
    }

    const x = (x1 + x2) / 2,
      y = (y1 + y2) / 2;
    const centersDist = Vector.distance(x, y, this.x, this.y);
    if (
      Math.abs(
        Vector.dy(
          centersDist,
          Math.abs(Vector.getAngle(this.x - x, this.y - y) - this.angle)
        ) / Math.sin(Math.abs(Vector.getAngle(x1 - x2, y1 - y2) - this.angle))
      ) >
      lineLen / 2
    )
      return false;
    const arrowCenterToInterceptDist =
      Vector.dx(
        centersDist,
        Math.abs(Vector.getAngle(this.x - x, this.y - y) - this.angle)
      ) -
      Vector.dx(
        Vector.dy(
          centersDist,
          Math.abs(Vector.getAngle(this.x - x, this.y - y) - this.angle)
        ) / Math.sin(Math.abs(Vector.getAngle(x1 - x2, y1 - y2) - this.angle)),
        Math.abs(Vector.getAngle(x1 - x2, y1 - y2) - this.angle)
      );
    if (Math.abs(arrowCenterToInterceptDist) > this.arrLen / 2) return false;
    return true;
  }
  //readable code doe doesHitLine
  // doesHitLine(
  //   x1: number,
  //   y1: number,
  //   x2: number,
  //   y2: number,
  //   lineLen?: number
  // ) {
  //   if (lineLen == null) {
  //     lineLen = Vector.distance(x1, y1, x2, y2);
  //   }

  //   const x = (x1 + x2) / 2,
  //     y = (y1 + y2) / 2;

  //   const centersDist = Vector.distance(x, y, this.x, this.y);
  //   const lineAngle = Vector.getAngle(x1 - x2, y1 - y2);
  //   const linetoArrowAngle = Math.abs(lineAngle - this.angle);
  //   const centersAxis = Vector.getAngle(this.x - x, this.y - y);
  //   const centerAxisToArrowAngle = Math.abs(centersAxis - this.angle);
  //   const lineCenterToArrowDistance = Vector.dy(
  //     centersDist,
  //     centerAxisToArrowAngle
  //   );
  //   const lineCenterToInterceptDistance =
  //     lineCenterToArrowDistance / Math.sin(linetoArrowAngle);
  //   if (Math.abs(lineCenterToInterceptDistance) > lineLen / 2) return false;
  //   const arrowCenterToLineCenterPerpandicularDist = Vector.dx(
  //     centersDist,
  //     centerAxisToArrowAngle
  //   );
  //   const arrowCenterToInterceptDist =
  //     arrowCenterToLineCenterPerpandicularDist -
  //     Vector.dx(lineCenterToInterceptDistance, linetoArrowAngle);
  //   if (Math.abs(arrowCenterToInterceptDist) > this.arrLen / 2) return false;
  //   return true;
  // }

  /**older implementation */
  // _doesHitLine(x1: number, y1: number, x2: number, y2: number, len?: number) {
  //   //replaced by doesHitLine
  //   if (len == null) {
  //     len = Vector.distance(x1, y1, x2, y2);
  //   }
  //   const lineX = (x1 + x2) / 2,
  //     lineY = (y1 + y2) / 2;
  //   const centersDist = Vector.distance(this.x, this.y, lineX, lineY);

  //   if (centersDist > this.arrLen / 2 + len / 2) return false;

  //   const lineAxis = Vector.getAngle(x1 - x2, y1 - y2);
  //   const interceptAxis = Vector.getAngle(this.x - lineX, this.y - lineY);
  //   const theta = Math.abs(this.angle - lineAxis);
  //   const sigma = Math.abs(lineAxis - interceptAxis);
  //   const phi = Math.PI - (theta + sigma);
  //   const arrowToLineDist = Math.abs(
  //     Math.sin(sigma) * (centersDist / Math.sin(theta))
  //   );
  //   const lineToArrowDist = Math.abs(
  //     Math.sin(phi) * (centersDist / Math.sin(theta))
  //   );

  //   return (
  //     this.arrLen > arrowToLineDist + arrowToLineDist &&
  //     len > lineToArrowDist + lineToArrowDist
  //   );
  // }

  doesHitCircle(x: number, y: number, r: number) {
    const theta = Math.abs(
      this.angle - Vector.getAngle(this.x - x, this.y - y)
    );
    const hypot = Vector.distance(this.x, this.y, x, y);
    const opposite = Math.abs(Vector.dy(hypot, theta));
    if (opposite > r) return false;
    if (
      Math.abs(Vector.dx(hypot, theta)) - Math.sqrt(r ** 2 - opposite ** 2) >
      this.arrLen / 2
    )
      return false;
    return true;
  }

  // doesHitCircle(x: number, y: number, r: number) { //easy to read
  //   const centerAxisAngle = Vector.getAngle(this.x - x, this.y - y);
  //   const theta = Math.abs(this.angle - centerAxisAngle);
  //   const hypot = Vector.distance(this.x, this.y, x, y);
  //   const opposite = Math.abs(Vector.dy(hypot, theta));
  //   if (opposite > r) return false;
  //   const adjacent = Math.abs(Vector.dx(hypot, theta));
  //   const innerAdjacent = Math.sqrt(r ** 2 - opposite ** 2);
  //   const arrCenterToCircleSurface = adjacent - innerAdjacent;
  //   if (arrCenterToCircleSurface > this.arrLen / 2) return false;
  //   return true;
  // }
}
