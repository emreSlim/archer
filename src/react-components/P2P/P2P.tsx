import React from 'react'
import {Connection, createRoom, joinRoom, leaveRoom } from '../../services'
import {Button, Router, RoomJoined, JoinARoom, Loader} from '..'

interface P2PProps {
  onBackClick: React.MouseEventHandler<HTMLButtonElement>;
  serverConn: Connection;
}

export const P2P: React.FC<P2PProps> = ({ serverConn, ...props }) => {
  const [selectedUI, setSelectedUI] = React.useState(0);
  const [roomID, setRoomID] = React.useState("");
  const [isRoomOwner, setIsRoomOwner] = React.useState(false);

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
          <JoinARoom
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
