export abstract class CanvasComponent {
  public x: number;
  public y: number;
  public focused = false;
  public hidden = false;

  private eventMap: Map<
    keyof HTMLElementEventMap,
    Map<CallableFunction, EventListenerOrEventListenerObject>
  >;

  constructor() {
    this.eventMap = new Map();
  }

  protected abstract _draw(
    ctx: CanvasRenderingContext2D,
    elapsedTime: number
  ): void;

  public draw(ctx: CanvasRenderingContext2D, elapsedTime: number) {
    if (this.hidden) return;
    if (ctx) {
      ctx.save();
      ctx.beginPath();
      this._draw(ctx, elapsedTime);
      ctx.restore();
    }
  }

  abstract doesPointIntercept(x: number, y: number): boolean;

  public addEventListener(
    canvas: HTMLCanvasElement,
    type: keyof HTMLElementEventMap,
    listener: (ev: any) => void
  ) {
    const listenerWrapper = (e: Event) => {
      if (e instanceof MouseEvent) {
        if (this.doesPointIntercept(e.clientX, e.clientY)) {
          listener(e);
        }
      } else {
        if (this.focused) {
          listener(e as any);
        }
      }
    };

    if (!this.eventMap.has(type)) this.eventMap.set(type, new Map());
    const map = this.eventMap.get(type);
    if (map) {
      map.set(listener, listenerWrapper);
    }
    canvas.addEventListener(type, listenerWrapper);
    return true;
  }

  public removeEventListener(
    canvas: HTMLCanvasElement,
    type: keyof HTMLElementEventMap,
    listener: (ev: Event) => void
  ) {
    const listenerWrapper = this.eventMap.get(type)?.get(listener);
    if (listenerWrapper) {
      canvas.removeEventListener(type, listenerWrapper);
      this.eventMap.get(type)?.delete(listener);
      return true;
    }
    return false;
  }
}
