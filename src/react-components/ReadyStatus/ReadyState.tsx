import React from "react";
import './style.css'

export const ReadyStatus: React.FC<{ player: boolean; opponent: boolean|undefined }> = (
  props
) => {
  return (
    <div className="ready-state">
      <p>Ready Status:</p>
      <div className="ready-state-container">
      <StatusBox name="Me" ready={props.player} />
      {props.opponent!=null && <StatusBox name="Opponent" ready={props.opponent} />}
      </div>
    </div>
  );
};

const StatusBox = ({ name, ready }: { name: string; ready: boolean }) => {
  return (
    <div

      className="status-box"
    >
      <strong>{name}</strong>
      <span className="span-button">{ready ? "\u2714" : "\u2716"}</span>
    </div>
  );
};
