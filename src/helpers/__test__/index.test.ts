import { Vector } from "../Science";
import { NumberE } from "../ExtendedClasses";

test("intercept should work", () => {
  expect(Vector.getIntercept(1, 2, 1, 2, 3, 5).toString()).toBe(
    [-7, 3].toString()
  );
});

test("intercept of lines", () => {
  // arrow
  const [x1, y1, x2, y2] = [0, 200, 109, 100];
  const c1x = (x1 + x2) / 2,
    c1y = (y1 + y2) / 2;

  //line
  const [x3, y3, x4, y4] = [110, 30, 110, 130];
  const c2x = (x3 + x4) / 2,
    c2y = (y3 + y4) / 2;

  const axis1 = Vector.getAngle(x1 - x2, y1 - y2);
  const axis2 = Vector.getAngle(x3 - x4, y3 - y4);
  const axis3 = Vector.getAngle(c1x - c2x, c1y - c2y);

  // console.log("axis1", NumberE.radToDeg(axis1));
  // console.log("axis2", NumberE.radToDeg(axis2));
  // console.log("axis3", NumberE.radToDeg(axis3));

  const theta = Math.abs(axis1 - axis2);
  const phi = Math.abs(axis1 - axis3);
  const sigma = Math.abs(axis2 - axis3);

  // console.log("theta", NumberE.radToDeg(theta));
  // console.log("phi", NumberE.radToDeg(phi));
  // console.log("sigma", NumberE.radToDeg(sigma));

  const ac = Vector.distance(c1x, c1y, c2x, c2y);
  const ab = Math.sin(sigma) * (ac / Math.sin(theta));
  const bc = Math.sin(phi) * (ac / Math.sin(theta));
  console.log(
    Vector.isDistGreater(x1, y1, x2, y2, ab + ab) &&
      Vector.isDistGreater(x3, y3, x4, y4, bc + bc)
  );

  // expect(
  //   Vector.getInterceptOf2Lines(0, 0, 100, 0, 100, -100, 100, 100).toString()
  // ).toBe([-7, 3].toString());
});
