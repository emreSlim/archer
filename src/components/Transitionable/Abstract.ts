export abstract class TransitionableProperty<T> {
  protected remTime = 0;
  public isAnimating = false;
  val: T;
  currentVal: T;
  protected velocity: T;

  constructor(val: T, currentVal: T, velocity: T) {
    this.val = val;
    this.currentVal = currentVal;
    this.velocity = velocity;
  }

  protected onEndCB: (() => void) | undefined;

  protected onEnd = () => {
    this.isAnimating = false;
    this.onEndCB?.();
  };
  protected abstract _onTick(elapTime: number): void;
  public stopAnimating() {
    this.isAnimating = false;
    this.remTime = 0;
  }
  onupdate() {}
  tick = (elapTime: number) => {
    if (this.isAnimating) {
      if (this.remTime > 0) {
        this._onTick(Math.min(this.remTime, elapTime));
        this.remTime -= elapTime;
        this.onupdate();
      } else {
        this.onEnd();
      }
    }
  };
}
