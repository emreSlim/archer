import React, { useEffect } from "react";
import { Back, clickSound, Loader, Lobby, LobbyUI, Menu } from "./react-components";
import {
  Connection,
  RequestPayload,
  PeerConnection,
  EventPayload,
  LocalStorage,
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
  game?: Archerman;
}

export class App extends React.Component<{}, AppState> {
  state: Readonly<AppState> = {
    showUI: AppUI.INIT,
    lobbyDefaultUI: LobbyUI.CREATE,
    log: [],
  };

  handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
  };

  componentDidMount = () => {
    document.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    window.addEventListener("back", this.handleBackClick);

    window.onkeyup = (e) => {
      if (e.ctrlKey && e.shiftKey && e.altKey) {
        const game = this.createGameInstance(0);
        game.isTesting = true;
        game.start();
        this.setState({ showUI: AppUI.CANVAS, game });

        // switch (e.key) {
        //   case 'M':
        // }
        window.onkeyup = null;
      }
    };
  };

  componentWillUnmount = () => {
    window.removeEventListener("back", this.handleBackClick);
    document.removeEventListener("touchmove", this.handleTouchMove);
  };

  getMusicMuted = () => {
    return localStorage.getItem("MusicMuted") == "true";
  };

  setMusicMuted = (val: boolean) => {
    this.state.game?.setMusicMute(val);
    localStorage.setItem("MusicMuted", String(val));
    this.forceUpdate();
  };

  getSFXMuted = () => {
    return localStorage.getItem("SFXMuted") == "true";
  };

  setSFXMuted = (val: boolean) => {
    this.state.game?.setSFXMute(val);
    localStorage.setItem("SFXMuted", String(val));
    this.forceUpdate();
  };

  handleBackClick = () => {
    switch (this.state.showUI) {
      case AppUI.CANVAS:
        this.exitRoom();
        this.state.game?.stop();
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
      this.state.game?.stop();
      this.loadGame();
    });

    serverConn.connect().then(() => {
      this.setState({ showUI: AppUI.LOBBY, serverConn });
    });
    this.setUpPeerConnection(serverConn);
  };

  setUpPeerConnection = (serverConn: Connection) => {
    const peerConn = new PeerConnection(serverConn);
    peerConn.onsetupcomplete = this.playGame;
    this.setState({ peerConn });
  };

  startGameBtnClickHandler = () => {
    this.state.peerConn?.sendOffer();
  };

  createGameInstance = (myPlayerIndex: number) => {
    const game = new Archerman(myPlayerIndex);
    game.setMusicMute(this.getMusicMuted());
    game.setSFXMute(this.getSFXMuted());
    return game;
  };
  playGame = async () => {
    if (this.state.peerConn && this.state.serverConn) {
      const game = this.createGameInstance(
        (
          await this.state.serverConn.request<number>(
            new RequestPayload("get.player.position")
          )
        ).data
      );

      game.log = (s) => {
        this.setState((state) => {
          state.log.push(s);
          return { log: state.log };
        });
      };

      game.ongameover = (won: boolean) => {
        this.setState({ showUI: AppUI.LOBBY, lobbyDefaultUI: LobbyUI.REPLAY });
      };

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
        this.state.peerConn?.sendData<Data<GameMouseEvent>>({
          data: e,
          type: DataEventType.PULL,
        });
      };
      game.onrelease = (...e) => {
        this.state.peerConn?.sendData<Data<any[]>>(
          {
            data: e,
            type: DataEventType.RELEASE,
          },
          true
        );
      };
      game.onturn = (airIntensity) => {
        this.state.peerConn?.sendData<Data<number>>(
          {
            data: airIntensity,
            type: DataEventType.TURN,
          },
          true
        );
      };
      game.onhit = (...args) => {
        this.state.peerConn?.sendData<Data<any[]>>(
          {
            data: args,
            type: DataEventType.HIT,
          },
          true
        );
      };
      game.onoutofframe = () => {
        this.state.peerConn?.sendData<Data<any>>(
          {
            type: DataEventType.ARROW_OUT_FRAME,
          },
          true
        );
      };
      game.onpullstart = (e) => {
        this.state.peerConn?.sendData<Data<GameMouseEvent>>(
          {
            data: e,
            type: DataEventType.PULLSTART,
          },
          true
        );
      };

      game.onplayermove = (...args) => {
        this.state.peerConn?.sendData<Data<number[]>>({
          data: args,
          type: DataEventType.MOVE,
        });
      };

      game.onbirdsfly = (args) => {
        this.state.peerConn?.sendData<Data<any[]>>(
          {
            data: args,
            type: DataEventType.BIRDS_FLY,
          },
          true
        );
      };

      game.onbirdhit = (index) => {
        this.state.peerConn?.sendData<Data<number>>(
          {
            data: index,
            type: DataEventType.BIRD_HIT,
          },
          true
        );
      };

      this.state.peerConn.ondata = (e: Data<any>) => {
        switch (e.type) {
          case DataEventType.PULL:
            {
              game.handlePullArrow(e.data);
            }
            break;
          case DataEventType.RELEASE:
            {
              game.handleReleaseArrow(e.data[0], e.data[1]);
              if (game.ca != null) {
                game.ca.angle = e.data[2];
                game.ca.vx = e.data[3];
                game.ca.vy = e.data[4];
              }
            }
            break;
          case DataEventType.TURN:
            {
              game.handleTurnChange(e.data);
            }
            break;
          case DataEventType.HIT:
            {
              if (game.ca != null) {
                game.ca.angle = e.data[2];
                game.ca.x = e.data[3];
                game.ca.y = e.data[4];
                game.ca.vx = e.data[5];
                game.ca.vy = e.data[6];
              }
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
      game.start();
      this.setState({ game });
    }
  };

  exitRoom = () => {
    this.state.serverConn?.emit(new EventPayload("exit.room"));
    this.state.game?.stop();
  };

  getUI = () => {
    switch (this.state.showUI) {
      case AppUI.LOADER:
        return <Loader />;
      case AppUI.CANVAS: {
        const Game = React.memo(() => {
          const id = "canvas-wrapper";
          useEffect(() => {
            if (this.state.game)
              document.getElementById(id)?.appendChild(this.state.game.canvas);
          }, []);
          return <div id={id} />;
        });
        return <Game />;
      }
      case AppUI.LOBBY:
        return (
          <Lobby
            onReplay={this.playGame}
            exitRoom={this.exitRoom}
            onExitLobby={() => {
              this.setState({ showUI: AppUI.INIT });
            }}
            defaultUI={this.state.lobbyDefaultUI}
            musicMuted={this.getMusicMuted()}
            onStartBtnClick={this.startGameBtnClickHandler}
            sfxMuted={this.getSFXMuted()}
            serverConn={this.state.serverConn}
            game={this.state.game}
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
  };

  render = () => {
    return <Menu/>
  }

  // render = () => {
  //   return (
  //     <>
  //       <div
  //         style={{
  //           position: "absolute",
  //           top: 20,
  //           left: 20,
  //           right: 20,
  //           display: "flex",
  //           justifyContent: this.state.game?.isGamePlaying
  //             ? "center"
  //             : "flex-start",
  //           gap: 20,
  //           zIndex: 1,
  //           alignItems: "center",
  //           opacity: this.state.game?.isGamePlaying ? 0.5 : 1,
  //         }}
  //       >
  //         {this.state.showUI !== AppUI.INIT && (
  //           <button
  //             onClick={() => {
  //               window.dispatchEvent(new Event("back", { bubbles: false }));
  //               this.playClickSound();
  //             }}
  //           >
  //             Back
  //           </button>
  //         )}
  //         <button
  //           onClick={() => {
  //             this.playClickSound();
  //             this.setMusicMuted(!this.getMusicMuted());
  //           }}
  //         >
  //           music {this.getMusicMuted() ? "off" : "on"}
  //         </button>
  //         <button
  //           onClick={() => {
  //             this.setSFXMuted(!this.getSFXMuted());
  //             this.playClickSound();
  //           }}
  //         >
  //           sfx {this.getSFXMuted() ? "off" : "on"}
  //         </button>
  //         <div>
  //           {this.state.log.map((l) => (
  //             <p>{l}</p>
  //           ))}
  //         </div>
  //       </div>
  //       {this.getUI()}
  //       <p
  //         style={{
  //           position: "fixed",
  //           right: 10,
  //           bottom: 10,
  //         }}
  //       >
  //         1.0.4
  //       </p>
  //     </>
  //   );
  // };
}

