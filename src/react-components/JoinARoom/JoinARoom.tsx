import React from 'react'
import { Button } from '..';
import { Connection } from '../../services';


export interface JoinRoomProps {
  onBackClick: (e?: React.MouseEvent) => void;
  attempRoomJoin: (
    roomID: string,
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
}

export const JoinARoom: React.FC<JoinRoomProps> = (props) => {
  const [roomID, setRoomID] = React.useState("");
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
