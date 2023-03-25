export class Debouncer {
  private timer?: number = undefined;
  private callback: CallableFunction = () => {};
  private delay?: number = undefined;
  constructor(callback: CallableFunction, delay: number) {
    this.callback = callback;
    this.delay = delay;
  }
  readonly schedule = (...args: any[]) => {
    if (this.timer != null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.callback(...args), this.delay);
  };
}
