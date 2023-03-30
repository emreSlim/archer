import React from 'react'
import { lobbyMusic } from '../index';
import './style.css'

export interface GameWindowProps {
  canvas?: HTMLCanvasElement;
}
export const GameWindow: React.FC<GameWindowProps> = (props) => {
  const ref = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  React.useEffect(() => {
    if (props.canvas) ref.current.appendChild(props.canvas);
    lobbyMusic.pause();

    return ()=> lobbyMusic.play()
  }, []);

  return <div className='game-window' ref={ref} />;
};