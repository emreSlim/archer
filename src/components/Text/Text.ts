import { CanvasComponent } from "..";

export class Text extends CanvasComponent {
  text: string;
  fontSize: number = 12;
  fontFamily = 'Courier New, Courier, monospace';
  style = '#00000088';
  centered = false;
  metrics: TextMetrics;
  constructor(
    text: string,
    x?: number,
    y?: number,
    fontSize?: number,
    fontFamily?: string
  ) {
    super();
    this.text = text;
    if (x != null) this.x = x;
    if (y != null) this.y = y;
    if (fontSize != null) this.fontSize = fontSize;
    if (fontFamily != null) this.fontFamily = fontFamily;
  }

  protected _draw(ctx: CanvasRenderingContext2D): void {
    ctx.resetTransform();
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.fillStyle = this.style;
    if (this.centered) {
      this.metrics = ctx.measureText(this.text);
      ctx.fillText(
        this.text,
        this.x - this.metrics.width / 2,
        this.y + this.fontSize / 2
      );
    } else {
      ctx.fillText(this.text, this.x, this.y);
    }
  }

  doesPointIntercept(x: number, y: number): boolean {
    if (this.centered) {
      if (
        x > this.x - this.metrics.width / 2 &&
        x < this.metrics.width / 2 + this.x &&
        y > this.y - this.fontSize / 2 &&
        y < this.fontSize / 2 + this.y
      )
        return true;
    } else {
      if (
        x > this.x &&
        x < this.metrics.width + this.x &&
        y > this.y &&
        y < this.fontSize + this.y
      )
        return true;
    }

    return false;
  }
}
