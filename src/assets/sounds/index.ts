export class Sound {
  static ctx = new (((window as any)
    .webkitAudioContext as typeof window.AudioContext) ||
    window.AudioContext)();

  isPaused = true;
  volume = 1;
  loop = false;

  private isMuted = false;
  private track: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;

  constructor(fileName: string) {
    this.load(fileName);
  }

  private async load(fileName: string) {
    const src = require("./" + fileName).default;
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await Sound.ctx.decodeAudioData(arrayBuffer);
    this.audioBuffer = audioBuffer;
  }

  play = (from = 0) => {
    if (this.isMuted || !this.isPaused) return;
    this.track = Sound.ctx.createBufferSource();
    this.track.loop = this.loop;
    const gainNode = Sound.ctx.createGain();
    gainNode.gain.value = this.volume;
    gainNode.connect(Sound.ctx.destination);
    this.track.connect(gainNode);
    this.track.buffer = this.audioBuffer;
    this.track.start(from);
    this.isPaused = false;
    this.track.onended = () => {
      this.isPaused = true;
    };
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
    this.isPaused = true;
  };
}
