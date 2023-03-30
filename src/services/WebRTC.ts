import { Random } from "archerman-common";
import { Connection, EventPayload } from "./";

const logIsOn = false;


export class WebRTC extends RTCPeerConnection {
  readonly s: Connection;
  /** out going data channel */
  readonly oDataChannel: RTCDataChannel;
  /** incoming data channel */
  // iDataChannel: RTCDataChannel;

  constructor(signallingConnection: Connection) {
    const configuration: RTCConfiguration = {
      iceServers: [
        {
          urls: "turn:relay.metered.ca:80",
          username: "7595c67c7d48d9b15fa113f7",
          credential: "/zjrnxxzCRmaMiG7",
        },
        {
          urls: "turn:relay.metered.ca:443",
          username: "7595c67c7d48d9b15fa113f7",
          credential: "/zjrnxxzCRmaMiG7",
        },
        {
          urls: "turn:relay1.expressturn.com:3478",
          username: "ef94AOVZJ78G3OIHBU",
          credential: "4Mwn5SVXkdOUswOw",
        },
      ],
    };
    super(configuration);

    this.s = signallingConnection;
    this.onicecandidate = this.onICECandidateHandler;
    this.oDataChannel = this.createDataChannel(Random.string(10));
    this.ondatachannel = this.onDataChannelHandler;
    this.listenForICE();
    this.listenForDesc();
  }

  ondata(data: any) {}
  onsetupcomplete() {}

  listenForICE() {
    this.s.addEventListener<RTCIceCandidate>("ice.candidate", async (e) => {
      if (e.data) {
        try {
          if (logIsOn) console.log("received ice", e.data);
          await this.addIceCandidate(e.data);
        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  onDataChannelHandler(e: RTCDataChannelEvent) {
    if (e.channel) {
      // this.iDataChannel = e.channel;
      if (logIsOn) console.log("received incoming DC", e.channel);
      e.channel.onopen = () => {
        e.channel.onmessage = (e: MessageEvent) => {
          const d = JSON.parse(e.data);
          if (logIsOn) console.log("received data", e.data);
          this.ondata(d);
        };
        this.onsetupcomplete();
      };
    }
  }

  onICECandidateHandler(e: RTCPeerConnectionIceEvent) {
    if (e.candidate) {
      const ep = new EventPayload<RTCIceCandidate>("ice.candidate");
      ep.data = e.candidate;
      this.s.emit(ep);
      if (logIsOn) console.log("recevied ice candidate", e.candidate);
    }
  }

  listenForDesc() {
    this.s.addEventListener<RTCSessionDescriptionInit>(
      "connect.opponent",
      async (e) => {
        const description = e.data;
        if (description) {
          await this.setRemoteDescription(description);
          if (logIsOn) console.log("received remote desc", description);
          if (!this.localDescription) {
            await this.sendAnswer();
          }
        }
      }
    );
  }

  async sendAnswer() {
    const desc = await this.createAnswer();
    await this.setLocalDescription(desc);
    const ep = new EventPayload<RTCSessionDescriptionInit>("connect.opponent");
    ep.data = desc;
    this.s.emit(ep);
    if (logIsOn) console.log("sending answer", desc);
  }

  async sendOffer() {
    const desc = await this.createOffer();
    await this.setLocalDescription(desc);
    const ep = new EventPayload<RTCSessionDescriptionInit>("connect.opponent");
    ep.data = desc;
    this.s.emit(ep);
    if (logIsOn) console.log("sending offer", desc);
  }
}
