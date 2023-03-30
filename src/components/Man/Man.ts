import { CanvasComponent, Arrow, Bow, Number2D, Part } from "..";
import { Tri, Vector } from "../../helpers";

export class Man extends CanvasComponent {
  public root: Part;
  public kneeL: Part;
  public kneeR: Part;
  public footL: Part;
  public footR: Part;
  public shldr: Part;
  public neck: Part;
  public alboR: Part;
  public alboL: Part;
  public palmR: Part;
  public palmL: Part;
  static HEAD_RADIUS = 5;
  static DEFAULT_ANGLE = (3 / 2) * Math.PI;
  public facingRight = false;

  public holdingArrow: Arrow | null = null;
  public arrowAO: number;
  public holdingBow: Bow | null = null;
  // collide check box
  public cBox: { x1: number; y1: number; x2: number; y2: number } | undefined;

  private cBoxScope: Part[];

  constructor(x: number, y: number, facingRight: boolean) {
    super();
    this.x = x;
    this.y = y;
    this.facingRight = facingRight;

    this.root = new Part(10);

    this.kneeL = new Part(10, this.root);
    this.footL = new Part(10, this.kneeL);
    this.kneeR = new Part(10, this.root);
    this.footR = new Part(10, this.kneeR);
    this.shldr = new Part(10, this.root);
    this.neck = new Part(9, this.shldr);
    this.alboL = new Part(10, this.shldr);
    this.palmL = new Part(10, this.alboL);
    this.alboR = new Part(10, this.shldr);
    this.palmR = new Part(10, this.alboR);
    this.arrowAO = facingRight ? -0.15 : 0.15;
    this.cBoxScope = [
      this.shldr,
      this.root,
      this.kneeL,
      this.kneeR,
      this.footL,
      this.footR,
    ];
  
    this.resetPosition();
  }

  resetPosition = () => {
    this.root.setAngleOffset(Man.DEFAULT_ANGLE);
    this.root.setPos(this.x, this.y, true);
    this.footL.setPos(this.x - 4, this.y + 19, !this.facingRight);
    this.footR.setPos(this.x + 4, this.y + 19, !this.facingRight);
    this.shldr.setAngleOffset(this.facingRight ? 0.15 : -0.15);
    this.neck.setAngleOffset(-this.shldr.getAngleOffset());
    this.alboL.setAngleOffset(Math.PI - this.shldr.getAngleOffset() * 1.5);
    this.palmL.setAngleOffset(-this.shldr.getAngleOffset() * 6);
    this.alboR.setAngleOffset(Math.PI - this.shldr.getAngleOffset() * 2);
    this.palmR.setAngleOffset(-this.shldr.getAngleOffset() * 8);
    this.updateCBox();

  };

  setPosition = (x: number, y: number) => {
    this.x = x;
    this.y = y;
    this.root.setPos(x, y, true);
  };

  holdBowArrow(b: Bow, a: Arrow) {
    this.holdingBow = b;
    this.holdingArrow = a;
    // this.matchBowArrowWithPalm();
    this.pullArrow(this.facingRight ? 1 : -1, 0, a);
  }

  updateCBox() {
    if (this.cBox == null)
      this.cBox = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
      };
    this.cBox.x1 = this.neck.getPos().x - Man.HEAD_RADIUS;
    this.cBox.y1 = this.neck.getPos().y - Man.HEAD_RADIUS;
    this.cBox.x2 = this.neck.getPos().x + Man.HEAD_RADIUS;
    this.cBox.y2 = this.neck.getPos().y + Man.HEAD_RADIUS;

    for (let p of this.cBoxScope) {
      this.cBox.x1 = Math.min(p.getPos().x, this.cBox.x1);
      this.cBox.x2 = Math.max(p.getPos().x, this.cBox.x2);
      this.cBox.y1 = Math.min(p.getPos().y, this.cBox.y1);
      this.cBox.y2 = Math.max(p.getPos().y, this.cBox.y2);
    }
  }

  walk = (x: number) => {
    this.x += x;
    this.root.movePos(x, 0, !this.facingRight);
    this.footL.movePos(-x, -1, !this.facingRight);
    window.setTimeout(() => {
      this.footL.movePos(x, 1, !this.facingRight);
    }, 50);
    this.footR.movePos(x, -1, !this.facingRight);
    window.setTimeout(() => {
      this.footR.movePos(-x, 1, !this.facingRight);
    }, 50);
  };

  isPointOutOfCBox = (x: number, y: number, margin: number) => {
    if (this.cBox)
      return (
        x < this.cBox.x1 - margin ||
        y < this.cBox.y1 - margin ||
        x > this.cBox.x2 + margin ||
        y > this.cBox.y2 + margin
      );
  };

  doesArrowHit = (a: Arrow) => {
    if (this.isPointOutOfCBox(a.x, a.y, a.arrLen)) {
      return 0;
    }

    if (
      a.doesHitCircle(
        this.neck.getPos().x,
        this.neck.getPos().y,
        Man.HEAD_RADIUS
      )
    )
      return 2;
    if (
      this.doesArrowHitPart(a, this.neck) ||
      this.doesArrowHitPart(a, this.shldr) ||
      this.doesArrowHitPart(a, this.kneeL) ||
      this.doesArrowHitPart(a, this.footL) ||
      this.doesArrowHitPart(a, this.kneeR) ||
      this.doesArrowHitPart(a, this.footR)
    )
      return 1;
    return 0;
  };

  doesArrowHitPart = (a: Arrow, p: Part) => {
    return a.doesHitLine(
      p.getPos().x,
      p.getPos().y,
      p.getParentPos().x,
      p.getParentPos().y
    );
  };

  releaseArrow = () => {
    if (this.holdingArrow) {
      const dx = this.palmR.getPos().x - this.holdingArrow.tx,
        dy = this.palmR.getPos().y - this.holdingArrow.ty;
      this.holdingArrow.vx = dx * 13;
      this.holdingArrow.vy = dy * 13;
      this.holdingArrow.isMoving = true;
      if (this.holdingBow) {
        this.holdingBow.nockingPointPull.animate([-5, 2, 0], 0.3);
        this.holdingArrow = null;
        this.holdingBow = null;
      }

      window.setTimeout(() => {
        this.alboL.setAngleOffset(-(0.2 + Math.PI / 2), 0, false);
        this.palmL.setAngleOffset(-2, 0, false);
        this.alboR.setAngleOffset(0.2 + Math.PI / 2, 0, false);
        this.palmR.setAngleOffset(2, 0, false);
      }, 3000);
    }
  };

  pullArrow(dx: number, dy: number, arrow: Arrow) {
    const angle = dx === 0 && dy === 0 ? arrow.angle : Vector.getAngle(dx, dy);
    {
      this.alboR.setAngleOffset(
        angle + (this.facingRight ? 0.8 : -0.8) - this.shldr.getAngle()
      );
      this.palmR.setAngleOffset(this.facingRight ? -1.2 : 1.2);
    }
    arrow.angle = angle;

    const arrowX = this.palmR.getPos().x - dx / 20;
    const arrowY = this.palmR.getPos().y - dy / 20;

    const pullDist = Vector.distance(
      arrowX,
      arrowY,
      this.palmR.getPos().x,
      this.palmR.getPos().y
    );
    const maxAllowedPull = arrow.arrLen * 0.4;

    if (maxAllowedPull > pullDist) {
      arrow.x = arrowX;
      arrow.y = arrowY;
    }
    this.palmL.setPos(arrow.tx, arrow.ty, this.facingRight, 0.2);

    if (this.holdingBow && this.holdingArrow) {
      this.holdingBow.x = this.palmR.getPos().x;
      this.holdingBow.y = this.palmR.getPos().y;
      this.holdingBow.angle = this.holdingArrow.angle;
      this.holdingBow.nockingPointPull.setVal(
        Math.min(pullDist, maxAllowedPull) + 5,
        0
      );
    }
    return Math.min(1, pullDist / maxAllowedPull);
  }

  updatePoint(p: Number2D, pd: Number2D, len: number, angle: number) {
    p.x = pd.x + Vector.dx(len, angle);
    p.y = pd.y + Vector.dy(len, angle);
  }

  protected _draw(ctx: CanvasRenderingContext2D, elapsedTime: number): void {
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    Object.values(this).forEach((v) => {
      if (v instanceof Part) v.draw(ctx, elapsedTime);
    });
    ctx.stroke();
    //head
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#000";

    ctx.arc(
      this.neck.getPos().x,
      this.neck.getPos().y,
      Man.HEAD_RADIUS,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  doesPointIntercept(x: number, y: number): boolean {
    throw new Error("Method not implemented.");
  }
}
