import { Sound, SoundConfig as SoundConfig } from "../assets/";

export class LocalStorage {
  static getSoundConfig = () => {
    return (JSON.parse(localStorage.getItem("sound-config")!) || {
      musicOn: true,
      musicVol: 0.5,
      sfxOn: true,
      sfxVol: 0.5,
    }) as SoundConfig;
  };

  static saveSoundConfig = () => {
    localStorage.setItem("sound-config", JSON.stringify(Sound.config));
  };
}
