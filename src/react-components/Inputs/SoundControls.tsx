import React from "react";
import { Button,  clickSoundd } from "..";
import "./style.css";
import { Sound } from "../../assets/";

export const SoundControls = () => {
  const [musicOn, setMusicOn] = React.useState(Sound.config.musicOn);
  const [sfxOn, setSFXOn] = React.useState(Sound.config.sfxOn);
  const [musicVol, setMusicVol] = React.useState(Sound.config.musicVol);
  const [sfxVol, setSFXVol] = React.useState(Sound.config.sfxVol);

  return (
    <>
      <Button
        className="sound-btn"
        onClick={() => {
          setMusicOn((p) => {
            Sound.setConfig({ musicOn: !p });
            return !p;
          });
        }}
      >
        <span className="sound-btn-text-container">
          Music
          {musicOn && <span>✓</span>}
        </span>
        <input
          className="sound-range-input"
          type="range"
          max={1}
          min={0}
          step={0.01}
          value={musicVol}
          onChange={(e) => {
            setMusicVol(+e.target.value);
            Sound.setConfig({ musicVol: +e.target.value });
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </Button>
      <Button
        className="sound-btn"
        noDefaultSound
        onClick={() =>
          setSFXOn((p) => {
            Sound.setConfig({ sfxOn: !p });
            clickSoundd.play();
            return !p;
          })
        }
      >
        <span className="sound-btn-text-container">
          Sound Effects {sfxOn && <span>&#x2713</span>}
        </span>
        <input
          className="sound-range-input"
          type="range"
          max={1}
          min={0}
          step={0.01}
          value={sfxVol}
          onChange={(e) => {
            setSFXVol(+e.target.value);
            Sound.setConfig({ sfxVol: +e.target.value });
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </Button>
    </>
  );
};
