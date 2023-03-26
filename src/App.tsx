import React, { useEffect } from "react";
import { Back, clickSound, Loader, Lobby, LobbyUI } from "./react-components";
import {
  Connection,
  RequestPayload,
  PeerConnection,
  EventPayload,
} from "./services";
import { Archerman, GameMouseEvent } from "./components/";
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
  lobbyDefaultUI: LobbyUI;
  log: string[];
  serverConn?: Connection;
  peerConn?: PeerConnection;
}

const game = new Archerman();

export class App extends React.Component<{}, AppState> {
  state: Readonly<AppState> = {
    showUI: AppUI.INIT,
    lobbyDefaultUI: LobbyUI.CREATE,
    log: [],
  };

  componentDidMount = () => {
    game.setMusicMute(this.getMusicMuted());
    game.setSFXMute(this.getSFXMuted());
    window.addEventListener("back", this.handleBackClick);

    window.onkeyup = (e) => {
      if (e.ctrlKey && e.shiftKey && e.altKey) {
        game.isTesting = true;
        game.start(0);
        this.setState({ showUI: AppUI.CANVAS });
        // switch (e.key) {
        //   case 'M':
        // }
        window.onkeyup = null;
      }
    };
    game.log = (s) => {
      this.setState((state) => {
        state.log.push(s);
        return { log: state.log };
      });
    };
    document.addEventListener(
      "touchmove",
      function (e) {
        e.preventDefault();
      },
      { passive: false }
    );

    game.ongameover = (won: boolean) => {
      this.setState({ showUI: AppUI.LOBBY, lobbyDefaultUI: LobbyUI.REPLAY });
    };
  };

  componentWillUnmount = () => {
    window.removeEventListener("back", this.handleBackClick);
  };

  getMusicMuted = () => {
    return localStorage.getItem("MusicMuted") == "true";
  };

  setMusicMuted = (val: boolean) => {
    game.setMusicMute(val);
    localStorage.setItem("MusicMuted", String(val));
    this.forceUpdate();
  };

  getSFXMuted = () => {
    return localStorage.getItem("SFXMuted") == "true";
  };

  setSFXMuted = (val: boolean) => {
    game.setSFXMute(val);
    localStorage.setItem("SFXMuted", String(val));
    this.forceUpdate();
  };

  handleBackClick = () => {
    switch (this.state.showUI) {
      case AppUI.CANVAS:
        this.exitRoom();
        game.stop();
        this.loadGame();
    }
  };

  loadGame = () => {
    this.playClickSound();
    this.setState({ showUI: AppUI.LOADER });
    if (this.state.serverConn) this.state.serverConn.ws.close();

    let serverConn = new Connection();

    serverConn.addEventListener("connect.opponent", () => {
      this.setState({ showUI: AppUI.LOADER });
    });

    serverConn.addEventListener("second.player.left", () => {
      alert("Other player has left the room.");
      this.exitRoom();
      game.stop();
      this.loadGame();
    });

    serverConn.connect().then(() => {
      this.setState({ showUI: AppUI.LOBBY, serverConn });
    });
    this.setPeerConnection(serverConn);
  };

  setPeerConnection = (serverConn: Connection) => {
    const peerConn = new PeerConnection(serverConn);
    peerConn.onsetupcomplete = () => {
      this.state.serverConn
        .request<number>(new RequestPayload("get.player.position"))
        .then((e) => {
          if (e.data != null) {
            this.playGame(e.data, peerConn);
          }
        });
    };
    this.setState({ peerConn });
  };

  startGameBtnClickHandler = () => {
    this.state.peerConn?.sendOffer();
  };

  playGame = (playerIndex: number, peerConn: PeerConnection) => {
    enum DataEventType {
      PULL,
      RELEASE,
      TURN,
      HIT,
      ARROW_OUT_FRAME,
      PULLSTART,
      MOVE,
      BIRDS_FLY,
      BIRD_HIT,
    }

    type Data<T> = {
      type: DataEventType;
      data?: T;
    };

    this.setState({ showUI: AppUI.CANVAS });
    game.onpull = (e) => {
      peerConn.sendData<Data<GameMouseEvent>>({
        data: e,
        type: DataEventType.PULL,
      });
    };
    game.onrelease = (...e) => {
      peerConn.sendData<Data<any[]>>(
        {
          data: e,
          type: DataEventType.RELEASE,
        },
        true
      );
    };
    game.onturn = (airIntensity) => {
      peerConn.sendData<Data<number>>(
        {
          data: airIntensity,
          type: DataEventType.TURN,
        },
        true
      );
    };
    game.onhit = (...args) => {
      peerConn.sendData<Data<any[]>>(
        {
          data: args,
          type: DataEventType.HIT,
        },
        true
      );
    };
    game.onoutofframe = () => {
      peerConn.sendData<Data<any>>(
        {
          type: DataEventType.ARROW_OUT_FRAME,
        },
        true
      );
    };
    game.onpullstart = (e) => {
      peerConn.sendData<Data<GameMouseEvent>>(
        {
          data: e,
          type: DataEventType.PULLSTART,
        },
        true
      );
    };

    game.onplayermove = (...args) => {
      peerConn.sendData<Data<number[]>>({
        data: args,
        type: DataEventType.MOVE,
      });
    };

    game.onbirdsfly = (args) => {
      peerConn.sendData<Data<any[]>>(
        {
          data: args,
          type: DataEventType.BIRDS_FLY,
        },
        true
      );
    };

    game.onbirdhit = (index) => {
      peerConn.sendData<Data<number>>(
        {
          data: index,
          type: DataEventType.BIRD_HIT,
        },
        true
      );
    };

    peerConn.ondata = (e: Data<any>) => {
      switch (e.type) {
        case DataEventType.PULL:
          {
            game.handlePullArrow(e.data);
          }
          break;
        case DataEventType.RELEASE:
          {
            game.handleReleaseArrow(e.data[0], e.data[1]);
            game.ca.angle = e.data[2];
            game.ca.vx = e.data[3];
            game.ca.vy = e.data[4];
          }
          break;
        case DataEventType.TURN:
          {
            game.handleTurnChange(e.data);
          }
          break;
        case DataEventType.HIT:
          {
            game.ca.angle = e.data[2];
            game.ca.x = e.data[3];
            game.ca.y = e.data[4];
            game.ca.vx = e.data[5];
            game.ca.vy = e.data[6];
            game.handlePlayerHit(e.data[0], e.data[1]);
          }
          break;
        case DataEventType.ARROW_OUT_FRAME:
          {
            game.handleArrowOutOfFrame();
          }
          break;
        case DataEventType.PULLSTART:
          {
            game.handlePullStart(e.data);
          }
          break;
        case DataEventType.MOVE:
          {
            game.handlePlayerMove(e.data[0], e.data[1]);
          }
          break;
        case DataEventType.BIRDS_FLY:
          {
            game.handleBirdsFly(e.data);
          }
          break;
        case DataEventType.BIRD_HIT: {
          game.handleBirdHit(e.data);
        }
      }
    };
    game.start(playerIndex);
  };

  exitRoom = () => {
    this.state.serverConn.emit(new EventPayload("exit.room"));
    game.stop();
  };

  getUI = () => {
    switch (this.state.showUI) {
      case AppUI.LOADER:
        return <Loader />;
      case AppUI.CANVAS: {
        const Game = React.memo(() => {
          const id = "canvas-wrapper";
          useEffect(() => {
            document.getElementById(id)?.appendChild(game.canvas);
          }, []);
          return <div id={id} />;
        });
        return <Game />;
      }
      case AppUI.LOBBY:
        return (
          <Lobby
            onReplay={() => {
              this.setState({ showUI: AppUI.CANVAS });
            }}
            exitRoom={this.exitRoom}
            onExitLobby={() => {
              this.setState({ showUI: AppUI.INIT });
            }}
            defaultUI={this.state.lobbyDefaultUI}
            musicMuted={this.getMusicMuted()}
            onStartBtnClick={this.startGameBtnClickHandler}
            sfxMuted={this.getSFXMuted()}
            serverConn={this.state.serverConn}
            game={game}
          />
        );
      case AppUI.INIT:
        return <button onClick={this.loadGame}>Load Game</button>;
    }
  };

  playClickSound = () => {
    if (!this.getSFXMuted()) {
      clickSound.play();
    }
  }

  render = () => {
    return (
      <>
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            display: "flex",
            justifyContent: game.isGamePlaying ? "center" : "flex-start",
            gap: 20,
            zIndex: 1,
            alignItems: "center",
            opacity: game.isGamePlaying ? 0.5 : 1,
          }}
        >
          {this.state.showUI !== AppUI.INIT && (
            <button
              onClick={() => {
                window.dispatchEvent(new Event("back", { bubbles: false }));
               this.playClickSound();
              }}
            >Back</button>
          )}
          <button
            onClick={() => {
              this.playClickSound();
              this.setMusicMuted(!this.getMusicMuted());
            }}
          >
            music {this.getMusicMuted() ? "off" : "on"}
          </button>
          <button
            onClick={() => {
              this.setSFXMuted(!this.getSFXMuted());
              this.playClickSound();
            }}
          >
            sfx {this.getSFXMuted() ? "off" : "on"}
          </button>
          <div>
            {this.state.log.map((l) => (
              <p>{l}</p>
            ))}
          </div>
        </div>
        {this.getUI()}
        <p
          style={{
            position: "fixed",
            right: 10,
            bottom: 10,
          }}
        >
          1.0.3
        </p>
      </>
    );
  };
}
