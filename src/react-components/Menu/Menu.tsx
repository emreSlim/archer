import React from "react";
import { Button, Loader, SoundControls, Router, P2P } from "..";
import { Sound } from "../../assets/index";
import { Connection } from "../../services/connection";

import "./styles.css";

export const lobbyMusic = new Sound("lobby_music.m4a");
lobbyMusic.loop = true;

interface MenuProps {}
interface MenuState {
  currentUI: number;
  serverConn?: Connection;
}

export class Menu extends React.Component<MenuProps, MenuState> {
  state: Readonly<MenuState> = {
    currentUI: 0,
  };

  componentDidMount(): void {
    document.onmousedown = () => {
      if (!lobbyMusic.isPlaying) lobbyMusic.play();
      document.onmousedown = null;
    };
  }

  componentWillUnmount(): void {
    lobbyMusic.pause();
  }

  handleP2PClick = async () => {
    if (
      this.state.serverConn == null ||
      this.state.serverConn.ws.readyState === 3
    ) {
      this.setState({ currentUI: 5 });

      try {
        const serverConn = new Connection();
        await serverConn.connect();
        this.setState({ currentUI: 1, serverConn });
      } catch (e) {
        alert("Unable to connect to the server. Please retry again.");
        console.error(e);
        this.setState({ currentUI: 0 });
      }
    } else {
      this.setState({ currentUI: 1 });
    }
  };

  render(): React.ReactNode {
    return (
      <div className="menu-container">
        {this.state.currentUI != 0 && (
          <Button
            style={{ alignSelf: "flex-start" }}
            onClick={() => {
              this.state.serverConn?.disconnect();
              this.setState({ currentUI: 0 });
            }}
          >
            HOME
          </Button>
        )}
        <Router
          elems={[
            //0
            <>
              <Button onClick={this.handleP2PClick}>Player vs Player</Button>
              <Button onClick={() => this.setState({ currentUI: 2 })}>
                Settings
              </Button>
              <Button onClick={() => this.setState({ currentUI: 3 })}>
                Help
              </Button>
              <Button onClick={() => this.setState({ currentUI: 4 })}>
                About
              </Button>
            </>,
            //1
            <P2P
              serverConn={this.state.serverConn!}
              onBackClick={() => this.setState({ currentUI: 0 })}
            />,
            //2
            <SoundControls />,
            //3
            <p>help</p>,
            //4
            <p>about</p>,
            //5
            <Loader />,
          ]}
          selected={this.state.currentUI}
        />
      </div>
    );
  }
}
