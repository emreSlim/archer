import React from 'react'

export interface GameWindowProps {
  canvas?: HTMLCanvasElement;
}
export const GameWindow: React.FC<GameWindowProps> = (props) => {
  const ref = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  React.useEffect(() => {
    if (props.canvas) ref.current.appendChild(props.canvas);
  }, []);

  return <div ref={ref} />;
};