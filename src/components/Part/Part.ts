import { Tri, Vector } from "../../helpers";
import { TransitionableProperty, TransNumber, TransNumber2D } from "../index";
import { Number2D as Number2D } from "../Number2D/Number2D";

export class Part {
  private pos = new TransNumber2D(0, 0);
  private angleOffset = new TransNumber(0);
  private length: TransNumber;
  private parent?: Part;
  private children: Part[] = [];
  constructor(length: number, parent?: Part) {
    this.length = new TransNumber(length);
    this.parent = parent;
    this.parent?.children.push(this);
    this.updatePosByAngle(0);
  }

  getParentAngle = () => this.parent?.getAngle() ?? 0;
  getParentLength = () => this.parent?.length.val ?? 0;
  getParentPos = () =>
    this.parent?.getPos() ?? new Number2D(Math.random(), Math.random());

  getAngle = (): number => this.getParentAngle() + this.angleOffset.val;
  getAngleOffset = () => this.angleOffset.val;
  getPos = () => this.pos.val;
  getLength = () => this.length.val;

  updatePosByAngle = (animateTime: number): boolean => {
    const angle = this.getAngle();
    const newX = this.getParentPos().x + Vector.dx(this.getLength(), angle);
    const newY = this.getParentPos().y + Vector.dy(this.getLength(), angle);

    if (isNaN(newX) || isNaN(newY)) {
      return false;
    }
    this.pos.setVal(newX, newY, animateTime);
    return true;
  };

  setAngleOffset = (
    newAngleOffset: number,
    animateTime = 0,
    cascade = true
  ) => {
    if (newAngleOffset !== this.getAngleOffset()) {
      this.angleOffset.setVal(newAngleOffset, animateTime);
      this.updatePosByAngle(animateTime);
    }

    if (cascade) {
      this.updateChildrenPos(animateTime);
    }
  };

  updateChildrenPos = (animateTime: number) => {
    this.children.forEach((child) => {
      child.updatePosByAngle(animateTime);
      child.setAngleOffset(child.angleOffset.val, animateTime);
    });
  };

  draw = (ctx: CanvasRenderingContext2D, elapsedTime: number) => {
    Object.values(this).forEach((v) => {
      if (v instanceof TransitionableProperty)
        v.isAnimating && v.tick(elapsedTime);
    });
    if (this.parent != null) {
      // ctx.beginPath();
      ctx.moveTo(this.parent.pos.currentVal.x, this.parent.pos.currentVal.y);
      ctx.lineTo(this.pos.currentVal.x, this.pos.currentVal.y);
      // ctx.stroke();
    }
  };

  movePos = (dx: number, dy: number, bendLeft: boolean) => {
    this.setPos(this.pos.val.x + dx, this.pos.val.y + dy, bendLeft);
  };

  setPos = (
    x: number,
    y: number,
    bendLeft: boolean,
    animateTime = 0
  ): boolean => {
    if (this.parent != null) {
      const grandParentPos = this.parent.getParentPos();
      const distTillGrandParent = Vector.distance(
        x,
        y,
        grandParentPos.x,
        grandParentPos.y
      );
      if (
        distTillGrandParent > this.getLength() + this.getParentLength() ||
        this.getParentLength() > distTillGrandParent + this.getLength() ||
        this.getLength() > distTillGrandParent + this.getParentLength()
      )
        return false;
      const grandParentAngle = this.parent.getParentAngle();
      const thisToGrandParentAngle = Vector.getAngle(
        x - grandParentPos.x,
        y - grandParentPos.y
      );
      const newParentAngleOffset =
        thisToGrandParentAngle +
        (bendLeft ? 1 : -1) *
          Tri.getFirstAngleFromSides(
            this.getLength(),
            this.getParentLength(),
            distTillGrandParent
          ) -
        grandParentAngle;
      if (!isNaN(newParentAngleOffset)) {
        this.parent.angleOffset.val = newParentAngleOffset;
        this.parent.updatePosByAngle(animateTime);
        const parentPos = this.getParentPos();
        const newAngleOffset =
          Vector.getAngle(x - parentPos.x, y - parentPos.y) -
          this.getParentAngle();
        this.angleOffset.val = newAngleOffset;
        this.parent.updateChildrenPos(animateTime);
        return true;
      } else {
        return false;
      }
    } else {
      this.pos.setVal(x, y, animateTime);
      this.setAngleOffset(this.angleOffset.val);
      return true;
    }
  };
}
