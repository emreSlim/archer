import React from 'react'
import { Archerman, GameMouseEvent } from "../../components";
import { Connection, PeerConnection, PeerEventType, PeerRequestType, RequestPayload } from "../../services";
import { Button } from '../Buttons';
import { Loader } from '../Loaders';
import { GameWindow, ReadyStatus } from '..';
import { Router } from '../Router';

interface RoomJoinedProps {
  onLeaveClick: (e?: React.MouseEvent) => void;
  isOwnerOfRoom: boolean;
  roomID: string;
  serverConn: Connection;
}


 interface RoomJoinedState {
  selectedUI: number;
  hasOtherPlayerJoined: boolean;
  game?: Archerman;
  peerConn: PeerConnection;
  isPlayerReady: boolean;
  isOpponentReady:boolean;
}

export class RoomJoined extends React.Component<RoomJoinedProps, RoomJoinedState> {
  state: Readonly<RoomJoinedState> = {
    selectedUI: 0,
    hasOtherPlayerJoined: !this.props.isOwnerOfRoom,
    peerConn: new PeerConnection(this.props.serverConn),
    isPlayerReady: this.props.isOwnerOfRoom,
    isOpponentReady:!this.props.isOwnerOfRoom
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
      () => this.state.isPlayerReady
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
            <p style={{alignSelf:'flex-start'}}>
              RoomID: <strong> {this.props.roomID}</strong>
            </p>
            <ReadyStatus player={this.state.isPlayerReady} opponent={this.state.isOpponentReady}/>
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
