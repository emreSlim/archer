import React from "react";
import { Menu } from "./react-components";
import { Connection, PeerConnection } from "./services";
import { Archerman } from "./components/";
import "./style.css";

enum AppUI {
  INIT,
  LOBBY,
  CANVAS,
  LOADER,
}

interface AppState {
  roomID?: string;
  showUI: AppUI;
  log: string[];
  serverConn?: Connection;
  peerConn?: PeerConnection;
  game?: Archerman;
}

export class App extends React.Component<{}, AppState> {
  state: Readonly<AppState> = {
    showUI: AppUI.INIT,
    log: [],
  };

  handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
  };

  componentDidMount = () => {
    document.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
  };

  componentWillUnmount = () => {
    document.removeEventListener("touchmove", this.handleTouchMove);
  };

  render = () => {
    return <Menu />;
  };
}
