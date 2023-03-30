import { LocalStorage } from "../../services";

export type SoundConfig = {
  musicVol: number;
  musicOn: boolean;
  sfxVol: number;
  sfxOn: boolean;
};

export class Sound {
  static config: SoundConfig = LocalStorage.getSoundConfig();

  static setConfig = (config: Partial<SoundConfig>) => {
    if (config.musicOn != null) Sound.config.musicOn = config.musicOn;
    if (config.musicVol != null) Sound.config.musicVol = config.musicVol;
    if (config.sfxOn != null) Sound.config.sfxOn = config.sfxOn;
    if (config.sfxVol != null) Sound.config.sfxVol = config.sfxVol;
    LocalStorage.saveSoundConfig();
  };

  static ctx = new (((window as any)
    .webkitAudioContext as typeof window.AudioContext) ||
    window.AudioContext)();

  isPlaying = false;
  volume = 1;
  loop = false;

  private isMuted = false;
  private track: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private gainNode: GainNode | null = null;
  private isMusic = false;
  constructor(fileName: string) {
    this.load(fileName);
  }

  private async load(fileName: string) {
    const src = require("./" + fileName).default;
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await Sound.ctx.decodeAudioData(arrayBuffer);
    this.audioBuffer = audioBuffer;
    if (audioBuffer.duration > 5) this.isMusic = true;
  }

  private getVolume = () => {
    return (
      this.volume * (this.isMusic ? Sound.config.musicVol : Sound.config.sfxVol)
    );
  };

  private getIsMuted = () => {
    return this.isMuted || this.isMusic
      ? !Sound.config.musicOn
      : !Sound.config.sfxOn;
  };

  play = (from = 0) => {
    if (this.getIsMuted()) return;
    this.track = Sound.ctx.createBufferSource();
    this.track.loop = this.loop;

    this.gainNode = Sound.ctx.createGain();

    this.gainNode.gain.value = this.getVolume();
    
    this.gainNode.connect(Sound.ctx.destination);
    this.track.connect(this.gainNode);
    this.track.buffer = this.audioBuffer;
    this.track.start(from);
    this.isPlaying = true;
    this.track.onended = () => {
      this.isPlaying = false;
    };
  };

  setVolume = (val: number) => {
    this.volume = val;
    if (this.gainNode) {
      this.gainNode.gain.value = this.getVolume();
    }
  };

  mute = () => {
    this.pause();
    this.isMuted = true;
  };
  unmute = () => {
    this.isMuted = false;
  };
  pause = () => {
    this.track?.disconnect();
    this.isPlaying = false;
  };
}
