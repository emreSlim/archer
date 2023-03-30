import { EventPayload, RequestPayload } from "archerman-common";
import React, { useEffect, useState } from "react";
import { Button, Loader, SoundControls } from "..";
import { Archerman, GameMouseEvent } from "../../components/index";
import { Connection } from "../../services/connection";
import { createRoom, leaveRoom } from "../../services/createRoom";
import { joinRoom } from "../../services/joinRoom";
import {
  PeerConnection,
  PeerEventType,
  PeerRequestType,
} from "../../services/";
import "./styles.css";

interface MenuProps {}
interface MenuState {
  currentUI: number;
  serverConn?: Connection;
}

export class Menu extends React.Component<MenuProps, MenuState> {
  state: Readonly<MenuState> = {
    currentUI: 0,
  };

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

interface RouterProps {
  elems: JSX.Element[];
  selected: number;
}

const Router: React.FC<RouterProps> = ({ elems, selected }) => {
  return elems[selected];
};

interface P2PProps {
  onBackClick: React.MouseEventHandler<HTMLButtonElement>;
  serverConn: Connection;
}

const P2P: React.FC<P2PProps> = ({ serverConn, ...props }) => {
  const [selectedUI, setSelectedUI] = useState(0);
  const [roomID, setRoomID] = useState("");
  const [isRoomOwner, setIsRoomOwner] = useState(false);

  const joinARoom = async (
    roomID: string,
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (serverConn) {
      setSelectedUI(3);
      try {
        if (await joinRoom(serverConn, roomID)) {
          setSelectedUI(1);
          setRoomID(roomID);
          setIsRoomOwner(false);
        } else {
          throw new Error("");
        }
      } catch (e) {
        alert("Unable to join room! Please recheck Room ID!");
        console.error(e);
        setSelectedUI(0);
      }
    } else {
      alert("Connection failed. Please try again.");
      props.onBackClick(e);
    }
  };

  const handleCreateRoom = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (serverConn) {
      setSelectedUI(3);
      try {
        const roomID = await createRoom(serverConn);
        if (!roomID || !Connection.isValidRoomID(roomID)) {
          throw new Error(
            "Invalid room id " + roomID + " received from server"
          );
        }
        setRoomID(roomID);
        setIsRoomOwner(true);
        setSelectedUI(1);
      } catch (e) {
        alert("Unable to create a room. Please try again.");
        console.error(e);
      }
    } else {
      alert("Connection failed. Please try again.");
      props.onBackClick(e);
    }
  };
  return (
    <>
      {selectedUI === 0 && (
        <Button className="top-right-btn" onClick={props.onBackClick}>
          Back
        </Button>
      )}
      <Router
        selected={selectedUI}
        elems={[
          //0
          <>
            <Button onClick={handleCreateRoom}>Create A Room</Button>
            <Button onClick={() => setSelectedUI(2)}>Join A Room</Button>
          </>,
          //1
          <RoomJoined
            roomID={roomID}
            isOwnerOfRoom={isRoomOwner}
            onLeaveClick={() => {
              setSelectedUI(0);
              if (serverConn) leaveRoom(serverConn);
            }}
            serverConn={serverConn}
          />,
          //2
          <JoinRoom
            attempRoomJoin={joinARoom}
            onBackClick={() => {
              setSelectedUI(0);
            }}
          />,
          //3
          <Loader />,
        ]}
      />
    </>
  );
};

interface RoomJoinedProps {
  onLeaveClick: (e?: React.MouseEvent) => void;
  isOwnerOfRoom: boolean;
  roomID: string;
  serverConn: Connection;
}

type Data<T> = {
  type: PeerEventType;
  data?: T;
};

interface RoomJoinedState {
  selectedUI: number;
  hasOtherPlayerJoined: boolean;
  game?: Archerman;
  peerConn: PeerConnection;
  ready: boolean;
}

class RoomJoined extends React.Component<RoomJoinedProps, RoomJoinedState> {
  state: Readonly<RoomJoinedState> = {
    selectedUI: 0,
    hasOtherPlayerJoined: !this.props.isOwnerOfRoom,
    peerConn: new PeerConnection(this.props.serverConn),
    ready: this.props.isOwnerOfRoom,
  };

  componentDidMount(): void {
    if (this.props.isOwnerOfRoom) {
      this.props.serverConn.addEventListener(
        "second.player.joined",
        this.handleOtherPlayerJoin
      );
    }

    this.props.serverConn.addEventListener(
      "second.player.left",
      this.handleOtherPlayerLeave
    );

    this.addListenersForPeerConnection(this.state.peerConn);

    this.state.peerConn.addPeerRequestListener(
      PeerRequestType.TEST,
      () => this.state.ready
    );
  }

  componentDidUpdate = (
    prevProps: Readonly<RoomJoinedProps>,
    prevState: Readonly<RoomJoinedState>,
    snapshot?: any
  ) => {};

  componentWillUnmount(): void {
    const serverConn = this.props.serverConn;
    if (this.props.isOwnerOfRoom) {
      serverConn.removeEventListener(
        "second.player.joined",
        this.handleOtherPlayerJoin
      );
    }

    serverConn.removeEventListener(
      "second.player.left",
      this.handleOtherPlayerLeave
    );

    this.state.peerConn?.close();
  }

  addListenersForPeerConnection = (peerConn: PeerConnection) => {
    peerConn.onsetupcomplete = async () => {
      await this.createGameInstance(peerConn);
    };

    peerConn.addPeerEventListener<undefined>(
      PeerEventType.START,
      this.startGame
    );
    peerConn.addPeerEventListener<GameMouseEvent>(PeerEventType.PULL, (data) =>
      this.state.game?.handlePullArrow(data)
    );

    peerConn.addPeerEventListener<
      [GameMouseEvent, GameMouseEvent, number, number, number]
    >(PeerEventType.RELEASE, (data) => {
      if (data && this.state.game) {
        const game = this.state.game;
        game.handleReleaseArrow(data[0], data[1]);
        if (game.ca != null) {
          game.ca.angle = data[2];
          game.ca.vx = data[3];
          game.ca.vy = data[4];
        }
      }
    });
    peerConn.addPeerEventListener<number>(PeerEventType.TURN, (data) => {
      this.state.game?.handleTurnChange(data);
    });

    peerConn.addPeerEventListener<number[]>(PeerEventType.HIT, (data) => {
      if (this.state.game) {
        const game = this.state.game;
        if (game.ca != null) {
          game.ca.angle = data[2];
          game.ca.x = data[3];
          game.ca.y = data[4];
          game.ca.vx = data[5];
          game.ca.vy = data[6];
        }
        game.handlePlayerHit(data[0], data[1]);
      }
    });

    peerConn.addPeerEventListener<undefined>(
      PeerEventType.ARROW_OUT_FRAME,
      () => this.state.game?.handleArrowOutOfFrame()
    );
    peerConn.addPeerEventListener<GameMouseEvent>(
      PeerEventType.PULLSTART,
      (data) => this.state.game?.handlePullStart(data)
    );

    peerConn.addPeerEventListener<[number, number]>(
      PeerEventType.MOVE,
      (data) => this.state.game?.handlePlayerMove(data[0], data[1])
    );
    peerConn.addPeerEventListener<number[]>(PeerEventType.BIRDS_FLY, (data) =>
      this.state.game?.handleBirdsFly(data)
    );
    peerConn.addPeerEventListener<number>(PeerEventType.BIRD_HIT, (data) =>
      this.state.game?.handleBirdHit(data)
    );
  };

  createGameInstance = async (peerConn: PeerConnection) => {
    const game = new Archerman(
      (
        await this.props.serverConn.request<number>(
          new RequestPayload("get.player.position")
        )
      ).data
    );
    game.ongameover = (won: boolean) => {
      this.setState({ selectedUI: 0 });
    };

    game.onpull = (e) => {
      peerConn.emit(PeerEventType.PULL, e);
    };
    game.onrelease = (...e) => {
      peerConn.emit(PeerEventType.RELEASE, e);
    };
    game.onturn = (airIntensity) => {
      peerConn.emit(PeerEventType.TURN, airIntensity);
    };

    game.onhit = (...args) => {
      peerConn.emit(PeerEventType.HIT, args);
    };
    game.onoutofframe = () => {
      peerConn.emit(PeerEventType.ARROW_OUT_FRAME, undefined, true);
    };

    game.onpullstart = (e) => {
      peerConn.emit(PeerEventType.PULLSTART, e, true);
    };

    game.onplayermove = (...args) => {
      peerConn.emit(PeerEventType.MOVE, args);
    };

    game.onbirdsfly = (args) => {
      peerConn.emit(PeerEventType.BIRDS_FLY, args);
    };

    game.onbirdhit = (index) => {
      peerConn.emit(PeerEventType.BIRD_HIT, index, true);
    };
    this.setState({ game });
    return game;
  };

  handleOtherPlayerJoin = () => {
    this.state.peerConn?.sendOffer();
    this.setState({ hasOtherPlayerJoined: true });
  };

  handleOtherPlayerLeave = () => {
    alert("Other player has left the room.");
    this.props.onLeaveClick();
  };

  startGame = () => {
    if (this.state.game) {
      this.setState({ selectedUI: 3 });
      this.state.game.start();
    } else {
      alert("something went wrong, please retry");
      this.props.onLeaveClick();
    }
  };

  handleStartBtnClick = async () => {
    const res = await this.state.peerConn.request(PeerRequestType.TEST)
    console.log(res)
    if (res === true) {
      this.state.peerConn.emit(
        PeerEventType.START,
        undefined,
        true,
        this.startGame
      );
    }
  };

  render = () => (
    <>
      <Button className="top-right-btn" onClick={this.props.onLeaveClick}>
        Leave Room
      </Button>
      <Router
        selected={this.state.selectedUI}
        elems={[
          //0
          <>
            <p>
              Room {this.props.isOwnerOfRoom ? "creat" : "join"}ed Successfully.
              RoomID: {this.props.roomID}
            </p>
            <Button
              hidden={
                !this.state.hasOtherPlayerJoined || !this.props.isOwnerOfRoom
              }
              onClick={this.handleStartBtnClick}
            >
              Start
            </Button>
          </>,
          //1
          <Button>Replay</Button>,
          //2
          <Loader />,
          //3
          <GameWindow canvas={this.state.game?.canvas} />,
        ]}
      />
    </>
  );
}

interface GameWindowProps {
  canvas?: HTMLCanvasElement;
}
const GameWindow: React.FC<GameWindowProps> = (props) => {
  const ref = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  useEffect(() => {
    if (props.canvas) ref.current.appendChild(props.canvas);
  }, []);

  return <div ref={ref} />;
};

interface JoinRoomProps {
  onBackClick: (e?: React.MouseEvent) => void;
  attempRoomJoin: (
    roomID: string,
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
}

const JoinRoom: React.FC<JoinRoomProps> = (props) => {
  const [roomID, setRoomID] = useState("");
  return (
    <>
      <Button className="top-right-btn" onClick={props.onBackClick}>
        Back
      </Button>
      <input
        type="text"
        onChange={(e) => {
          setRoomID(e.target.value);
        }}
        value={roomID}
      />
      <Button
        onClick={(e) => {
          if (Connection.isValidRoomID(roomID)) {
            props.attempRoomJoin(roomID, e);
          } else {
            alert("Invalid Room ID!");
          }
        }}
      >
        Attempt Join
      </Button>
    </>
  );
};
