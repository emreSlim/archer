import React from "react";
import { Vector } from "../../helpers/Science";

export const Loader = () => {
  const colorPrimary = "black",
    colorSecondary = "orange";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      style={{ margin: "auto", display: "block" }}
      width="60px"
      height="60px"
      viewBox="0 0 60 60"
      preserveAspectRatio="xMidYMid"
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        return (
          <circle
            key={i}
            cx={30 + Vector.dx(20, (Math.PI / 4) * i)}
            cy={30 + Vector.dy(20, (Math.PI / 4) * i)}
            r={7}
            fill={colorPrimary}
          >
            <animate
              attributeName="fill"
              values={`${colorSecondary};${colorPrimary};${colorPrimary}`}
              keyTimes="0;0.125;1"
              dur="1s"
              repeatCount="indefinite"
              begin={i * 0.125 + "s"}
              calcMode="discrete"
            />
          </circle>
        );
      })}
    </svg>
  );
};
