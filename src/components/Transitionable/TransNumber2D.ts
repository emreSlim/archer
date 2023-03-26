import { TransitionableProperty } from ".";
import { Number2D } from "../index";

export class TransNumber2D extends TransitionableProperty<Number2D> {
  constructor(x: number, y: number) {
    super(new Number2D(x, y), new Number2D(x, y), new Number2D(0, 0));
  }

  setVal = (
    x: number,
    y: number,
    animateDuration: number,
    onEndCB?: () => void
  ) => {
    if (animateDuration > 0) {
      this.remTime = animateDuration;
      this.velocity.x = (x - this.currentVal.x) / animateDuration;
      this.velocity.y = (y - this.currentVal.y) / animateDuration;
      this.isAnimating = true;
      this.onEndCB = onEndCB;
    } else {
      this.currentVal.x = x;
      this.currentVal.y = y;
      this.onupdate();
    }
    this.val.x = x;
    this.val.y = y;
  };

  protected _onTick(elapTime: number): void {
    this.currentVal.x += this.velocity.x * elapTime;
    this.currentVal.y += this.velocity.y * elapTime;
  }
}
