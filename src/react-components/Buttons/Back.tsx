import React from "react";

interface BackProps {
  onClick: () => void;
}

export const Back: React.FC<BackProps> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="45px"
      height="45px"
      viewBox="0 0 40 40"
      preserveAspectRatio="xMidYMid"
    >
      <polygon
        onClick={() => {
          window.dispatchEvent(new Event("back", { bubbles: false }));
          props.onClick();
        }}
        points="10,20 30,10 30,30"
        radius="10px"
        fill="black"
        className="svgbtn"
      ></polygon>
    </svg>
  );
};
