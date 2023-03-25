export class Motion {
  /**first equation of motion */
  static v = (u: number, a: number, t: number) => u + a * t;
  /**second equation of motion */
  static s = (u: number, a: number, t: number) => u * t + (a * t ** 2) / 2;
}

export class Tri {
  static getFirstAngleFromSides = (a: number, b: number, c: number) => {
    return Math.acos((b ** 2 + c ** 2 - a ** 2) / (2 * b * c));
  };
  // static getAnglesFromSides = (a:number,b:number,c:number) => {

  // }
}

export class Vector {
  static absAngle = (angle: number) =>
    (((angle % 2) * Math.PI + 2 * Math.PI) % 2) * Math.PI;

  static getAngle = (dx: number, dy: number) => {
    if (dx === 0 && dy === 0) return 0;
    return Math.atan(dy / dx) + Vector.getQuad(dx, dy);
  };
  /**get geometric sign */
  static getQuad = (vx: number, vy: number) => {
    if (vx < 0 && vy >= 0) {
      return Math.PI;
    } else if (vx < 0 && vy < 0) {
      return Math.PI;
    } else if (vy < 0 && vx >= 0) {
      return Math.PI * 2;
    }
    return 0;
  };
  static distSqr = (x1: number, y1: number, x2 = 0, y2 = 0) =>
    (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);

  static distance = (x1: number, y1: number, x2 = 0, y2 = 0) =>
    Math.sqrt(Vector.distSqr(x1, y1, x2, y2));

  /** check is distance of two points is greater than dist2 */
  static isDistGreater = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    dist2: number
  ) => this.distSqr(x1, y1, x2, y2) > dist2 * dist2;

  static dx = (ds: number, angle: number) => Math.cos(angle) * ds;

  static dy = (ds: number, angle: number) => Math.sin(angle) * ds;

  static getLineCoeffs(x1: number, y1: number, x2: number, y2: number) {
    // by = ax + c
    const a = (y1 - y2) / (x1 - x2);
    const c = y1 - a * x1;
    return [a, 1, c];
  }
  static getIntercept(
    a1: number,
    b1: number,
    c1: number,
    a2: number,
    b2: number,
    c2: number
  ) {
    const divisor = a1 * b2 - a2 * b1;
    const x = (b1 * c2 - b2 * c1) / divisor;
    const y = (a2 * c1 - a1 * c2) / divisor;
    return [x, y];
  }
  static getInterceptOf2Lines(
    l1x1: number,
    l1y1: number,
    l1x2: number,
    l1y2: number,
    l2x1: number,
    l2y1: number,
    l2x2: number,
    l2y2: number
  ) {
    const [a1, b1, c1] = Vector.getLineCoeffs(l1x1, l1y1, l1x2, l1y2);
    const [a2, b2, c2] = Vector.getLineCoeffs(l2x1, l2y1, l2x2, l2y2);

    return Vector.getIntercept(a1, b1, c1, a2, b2, c2);
  }
}
