import { CanvasComponent, Number2D } from "..";

export class AimPath extends CanvasComponent {
  private r = 1.5;
  private pointsArray = [
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
  ];

  
  private previousPoints:Number2D[] = [
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
    new Number2D(-1, -1),
  ]

  copyAsPreviousPath = () => {
    this.pointsArray.forEach((p,i)=>{
      this.previousPoints[i].x = p.x;
      this.previousPoints[i].y = p.y;
    })
  }
  /**
   * No need of x acceleration
   */
  updateState = (vx:number,vy:number,ay:number) => {
    const timeGap = 0.05
    let cp = {x:0,y:0}
    for(let i = 0;i<this.pointsArray.length ;i++){
      vy = vy + ay * timeGap
      cp.x  =  cp.x + vx * timeGap
      cp.y = cp.y +  vy * timeGap
         this.pointsArray[i].x = cp.x+ this.x
         this.pointsArray[i].y = cp.y + this.y
    }
  };

  protected _draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "black";
    const cb = (p:Number2D, i:number) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.r - i * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    this.pointsArray.forEach(cb);
    if(this.previousPoints.length){
      ctx.fillStyle = "#0008"
      this.previousPoints.forEach(cb)
    }
  }
  doesPointIntercept(x: number, y: number): boolean {
    throw new Error("Method not implemented.");
  }
}
