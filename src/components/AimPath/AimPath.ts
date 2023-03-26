import { CanvasComponent, Number2D } from "..";

export class AimPath extends CanvasComponent {
  private r = 1.5;
  private pointsArray = [
    new Number2D(0, 0),
    new Number2D(0, 0),
    new Number2D(0, 0),
    new Number2D(0, 0),
    new Number2D(0, 0),
    new Number2D(0, 0),
    new Number2D(0, 0),
    new Number2D(0, 0),
    new Number2D(0, 0),
    new Number2D(0, 0),
  ];

  updateState = (vx:number,vy:number,ax:number,ay:number) => {
    const timeGap = 0.05
    let cp = {x:0,y:0}
    for(let i = 0;i<this.pointsArray.length ;i++){
      vx = vx + ax * timeGap
      vy = vy + ay * timeGap
        this.pointsArray[i].x =  cp.x + vx * timeGap
        this.pointsArray[i].y = cp.y +  vy * timeGap
        cp.x = this.pointsArray[i].x
        cp.y = this.pointsArray[i].y
    
    }
  };

  protected _draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "black";
    this.pointsArray.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(this.x + p.x, this.y + p.y, this.r - i * 0.1, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  doesPointIntercept(x: number, y: number): boolean {
    throw new Error("Method not implemented.");
  }
}
