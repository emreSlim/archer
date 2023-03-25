import React from "react";
import "./style.css";
import { Sound, Archerman } from "../../components/";
import { Loader } from "..";
import { Connection, createRoom, EventPayload, joinRoom } from "../../services";

export enum LobbyUI {
  LOADER,
  CREATE,
  JOININPUT,
  JOINED,
  REPLAY,
}

const lobbyMusic = new Sound("lobby_music.m4a");
lobbyMusic.loop = true;
lobbyMusic.volume = 0.5;
export const clickSound = new Sound("click_sound.m4a");
clickSound.volume = 0.5;

interface LobbyState {
  roomID: string;
  isRoomOwner?: boolean;
  secondPlayerJoined: boolean;
  showUI: LobbyUI;
}

interface LobbyProps {
  defaultUI: LobbyUI;
  serverConn: Connection;
  sfxMuted: boolean;
  musicMuted: boolean;
  game: Archerman;
  onStartBtnClick: React.MouseEventHandler<HTMLButtonElement>;
  onReplay: () => void;
  exitRoom: () => void;
  onExitLobby: () => void;
}

export class Lobby extends React.Component<LobbyProps, LobbyState> {
  state: LobbyState = {
    roomID: "",
    secondPlayerJoined: false,
    showUI: this.props.defaultUI,
  };

  componentDidMount = () => {
    if (this.props.musicMuted === false) {
      window.setTimeout(() => {
        lobbyMusic.play();
      }, 100);
    }
    window.addEventListener("back", this.handleBackClick);
  };

  componentDidUpdate = (pProps: LobbyProps) => {
    if (pProps.musicMuted !== this.props.musicMuted) {
      if (this.props.musicMuted) {
        lobbyMusic.pause();
      } else {
        lobbyMusic.play();
      }
    }
  };

  componentWillUnmount = () => {
    lobbyMusic.pause();
    window.removeEventListener("back", this.handleBackClick);
  };

  handleBackClick = () => {
    switch (this.state.showUI) {
      case LobbyUI.CREATE:
        this.props.onExitLobby();
        break;
      case LobbyUI.LOADER:
      case LobbyUI.JOINED:
      case LobbyUI.REPLAY:
        this.props.exitRoom();
        this.setState({
          showUI: LobbyUI.CREATE,
          roomID: "",
          secondPlayerJoined: false,
          isRoomOwner: false,
        });
        break;
      case LobbyUI.JOININPUT:
        this.setState({ showUI: LobbyUI.CREATE });
        break;
    }
  };

  handleCreateBtnClick = () => {
    if (!this.props.sfxMuted) clickSound.play();
    this.setState({ showUI: LobbyUI.LOADER });
    createRoom(this.props.serverConn)
      .then((roomID) => {
        if (Connection.isValidRoomID(roomID)) {
          this.setState({ roomID, isRoomOwner: true, showUI: LobbyUI.JOINED });
          this.waitForSecondPlayer();
        }
      })
      .catch(() => {
        this.setState({ showUI: LobbyUI.CREATE });
      });
  };

  waitForSecondPlayer = () => {
    this.props.serverConn.addEventListener("second.player.joined", () => {
      this.setState({ secondPlayerJoined: true });
    });
  };

  handleJoinBtnClick = () => {
    if (!this.props.sfxMuted) clickSound.play();
    if (Connection.isValidRoomID(this.state.roomID)) {
      this.setState({ showUI: LobbyUI.LOADER });
      joinRoom(this.props.serverConn, this.state.roomID.toUpperCase())
        .then((isSuccessful) => {
          if (isSuccessful) {
            this.setState({ showUI: LobbyUI.JOINED });
          } else {
            alert("Unable to join room! Please recheck Room ID!");
            this.setState({ showUI: LobbyUI.JOININPUT });
          }
        })
        .catch(() => {
          this.setState({ showUI: LobbyUI.JOININPUT });
        });
    } else {
      alert("Invalid Room ID!");
      this.setState({ showUI: LobbyUI.JOININPUT });
    }
  };

  handleReplayClick = () => {
    if (!this.props.sfxMuted) clickSound.play();
    this.props.game.play();
    this.props.onReplay();
  };

  getUI = (showUI: LobbyUI) => {
    switch (showUI) {
      case LobbyUI.LOADER:
        return <Loader />;
      case LobbyUI.JOININPUT:
        return (
          <>
            <input
              type="text"
              onChange={(e) => {
                this.setState({ roomID: e.target.value });
              }}
              value={this.state.roomID}
            />
            <button onClick={this.handleJoinBtnClick}>Attempt Join</button>
          </>
        );
      case LobbyUI.CREATE:
        return (
          <>
            <button onClick={this.handleCreateBtnClick}>Create a Room</button>
            <button
              onClick={() => {
                if (!this.props.sfxMuted) clickSound.play();
                this.setState({ showUI: LobbyUI.JOININPUT });
              }}
            >
              Join a Room
            </button>
          </>
        );
      case LobbyUI.REPLAY:
        return <button onClick={this.handleReplayClick}>Replay</button>;
      case LobbyUI.JOINED:
        return (
          <>
            <p>
              Room {this.state.isRoomOwner ? "Created" : "Joined"}. RoomID:{" "}
              {this.state.roomID}
            </p>
            {this.state.secondPlayerJoined && (
              <button
                onClick={(e) => {
                  if (!this.props.sfxMuted) clickSound.play();
                  this.props.onStartBtnClick(e);
                }}
              >
                Start Game
              </button>
            )}
          </>
        );
    }
  };

  render(): React.ReactNode {
    return (
      <div className="lobby-container">{this.getUI(this.state.showUI)}</div>
    );
  }
}
