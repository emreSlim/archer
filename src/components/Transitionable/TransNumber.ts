import { TransitionableProperty } from ".";

export class TransNumber extends TransitionableProperty<number> {
  constructor(val: number) {
    super(val, val, 0);
  }
  /**
   *
   * @param val target value
   * @param animateDuration time in seconds
   * @param onEndCB callback called on end of transition
   */
  setVal = (val: number, animateDuration: number, onEndCB?: () => void) => {
    if (animateDuration > 0) {
      this.remTime = animateDuration;
      this.velocity = (val - this.currentVal) / animateDuration;
      this.isAnimating = true;
      this.onEndCB = onEndCB;
    } else {
      this.currentVal = val;
      this.onupdate();
    }
    this.val = val;
  };
  animate = (
    targets: number[],
    duration: number,
    loop?: boolean,
    onEndCB?: () => void
  ) => {
    this.stopAnimating();

    let i = 0;
    const dur = duration / targets.length;
    const cb = () => {
      const endcb = loop || i + 1 < targets.length ? cb : onEndCB;
      this.setVal(targets[i], dur, endcb);
      i++;
      if (i >= targets.length) i = 0;
    };
    cb();
  };

  protected _onTick(elapTime: number): void {
    this.currentVal += this.velocity * elapTime;
  }
}
