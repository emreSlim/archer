import { Random } from "archerman-common";
import { Connection, EventPayload } from "./";

const logIsOn = false;


enum PeerDataType {
  DATA,
  ACK,
}

type PeerDataArray<T = unknown> = [
  PeerDataType,
  /** numerical id */
  number,
  /** data */
  T?
];

class PeerData<T = unknown> {
  type: PeerDataType;
  id: number;
  data?: T;
  constructor(type: PeerDataType, id: number, data?: T) {
    this.type = type;
    this.id = id;
    this.data = data;
  }
  toArray = () => {
    const arr: PeerDataArray<T> = [this.type, this.id];
    if (this.data != null) arr[2] = this.data;
    return arr;
  };
  static fromArray = <T>(arr: PeerDataArray<T>) => new PeerData(...arr);
}

export class PeerConnection extends RTCPeerConnection {
  readonly s: Connection;
  /** out going data channel */
  readonly oDataChannel: RTCDataChannel;
  /** incoming data channel */
  iDataChannel: RTCDataChannel;
  pendingACKs = new Map<number, number>();

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

  sendData<T>(data: T, withAck?: boolean) {
    if(logIsOn) console.log('sending data',data)
    if (withAck) {
     
      const id = Random.int(999999, 100000);
      const d = new PeerData<T>(PeerDataType.DATA, id, data);

      this.oDataChannel.send(JSON.stringify(d.toArray()));
      const timerID = window.setInterval(() => {
        this.oDataChannel.send(JSON.stringify(d.toArray()));
      }, 10000);

      this.pendingACKs.set(id, timerID);
    } else {
      this.oDataChannel.send(JSON.stringify(data));
    }
  }

  ondata(data: any) {}
  onsetupcomplete() {}

  listenForICE() {
    this.s.addEventListener<RTCIceCandidate>("ice.candidate", async (e) => {
      if (e.data) {
        try {
          if(logIsOn) console.log('received ice',e.data)
          await this.addIceCandidate(e.data);
        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  onDataChannelHandler(e: RTCDataChannelEvent) {
    if (e.channel) {
      this.iDataChannel = e.channel;
      if(logIsOn) console.log('received incoming DC',e.channel)
      this.iDataChannel.onopen = () => {
        this.iDataChannel.onmessage = (e: MessageEvent) => {
          const d = JSON.parse(e.data);
          if(logIsOn) console.log('received data',e.data)
          if (d instanceof Array) {
            const peerData = PeerData.fromArray(d as PeerDataArray);
            if (peerData.type === PeerDataType.DATA) {
              this.ondata(peerData.data);
              //send ack
              this.oDataChannel.send(
                JSON.stringify(
                  new PeerData(PeerDataType.ACK, peerData.id).toArray()
                )
              );
            } else if (peerData.type === PeerDataType.ACK) {
              window.clearInterval(this.pendingACKs.get(peerData.id));
              this.pendingACKs.delete(peerData.id);
            }
          } else {
            this.ondata(d);
          }
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
      if(logIsOn) console.log('recevied ice candidate',e.candidate)
    }
  }

  listenForDesc() {
    this.s.addEventListener<RTCSessionDescriptionInit>(
      "connect.opponent",
      async (e) => {
        const description = e.data;
        if (description) {
          await this.setRemoteDescription(description);
          if(logIsOn) console.log('received remote desc',description)
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
    if(logIsOn) console.log('sending answer',desc)

  }

  async sendOffer() {
    const desc = await this.createOffer();
    await this.setLocalDescription(desc);
    const ep = new EventPayload<RTCSessionDescriptionInit>("connect.opponent");
    ep.data = desc;
    this.s.emit(ep);
    if(logIsOn) console.log('sending offer',desc)

  }
}
