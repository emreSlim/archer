import React from "react";
import { lobbyMusic } from "../index";
import "./style.css";

export interface GameWindowProps {
  canvas?: HTMLCanvasElement;
}
export const GameWindow: React.FC<GameWindowProps> = (props) => {
  const ref = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  React.useEffect(() => {
    if (props.canvas) {
      ref.current.appendChild(props.canvas);

      const html = document.documentElement;
      if (html.requestFullscreen) html.requestFullscreen();
      //@ts-ignore
      else if (html.webkitRequestFullscreen) html.webkitRequestFullscreen();
      //@ts-ignore
      else if (html.msRequestFullscreen) html.msRequestFullscreen();
    }
    lobbyMusic.pause();

    return () => {
      if (document.exitFullscreen) document.exitFullscreen();
      //@ts-ignore
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      //@ts-ignore
      else if (document.msExitFullscreen) document.msExitFullscreen();

      lobbyMusic.play();
    };
  }, []);

  return <div className="game-window" ref={ref} />;
};
