import { Vector } from "../../helpers/";
import { CanvasComponent, Img, TransNumber } from "..";

export class Bow extends CanvasComponent {
  static IMG = new Img("bow_512.png").image;
  angle: number = 0;
  public size = 37;
  private imagesize = this.size / Math.sqrt(2);
  nockingPointPull = new TransNumber(0);
  bowCurveDepth = 10;

  protected _draw(ctx: CanvasRenderingContext2D, elapsedTime: number): void {
    this.nockingPointPull.tick(elapsedTime);
    const nockingPointX =
      this.x - Vector.dx(5 + this.nockingPointPull.currentVal, this.angle);
    const nockingPointY =
      this.y - Vector.dy(5 + this.nockingPointPull.currentVal, this.angle);

    const x = this.x - Vector.dx(5, this.angle);
    const y = this.y - Vector.dy(5, this.angle);

    const dx = Vector.dx(this.size / 2, this.angle + Math.PI / 2);
    const dy = Vector.dy(this.size / 2, this.angle + Math.PI / 2);

    const x1 = x + dx,
      y1 = y + dy;
    const x2 = x - dx,
      y2 = y - dy;
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "#000";
    ctx.moveTo(x1, y1);
    ctx.lineTo(nockingPointX, nockingPointY);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI - Math.PI / 4 + this.angle);
    ctx.translate(-this.x, -this.y);
    ctx.drawImage(
      Bow.IMG,
      this.x - this.imagesize / 2 + this.imagesize * 0.138671875,
      this.y - this.imagesize / 2 + this.imagesize * 0.138671875,
      this.imagesize,
      this.imagesize
    );
  }
  doesPointIntercept(x: number, y: number): boolean {
    throw new Error("Method not implemented.");
  }
}
