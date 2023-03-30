import { Connection, WebRTC } from ".";
import { Random } from "../helpers";

enum PeerDataType {
  EVENT,
  ACK,
  REQUEST,
  RESPONSE,
}

type PeerDataArray = [
  PeerDataType,
  /** numerical id */
  number,
  /** data */
  any[]?
];

class PeerData {
  type: PeerDataType;
  id: number;
  data?: any[];
  constructor(type: PeerDataType, id: number, data?: any[]) {
    this.type = type;
    this.id = id;
    this.data = data;
  }
  toArray = () => {
    const arr: PeerDataArray = [this.type, this.id];
    if (this.data != null) arr[2] = this.data;
    return arr;
  };
  static fromArray = (arr: PeerDataArray) => new PeerData(...arr);
}

export enum PeerEventType {
  PULL,
  RELEASE,
  TURN,
  HIT,
  ARROW_OUT_FRAME,
  PULLSTART,
  MOVE,
  BIRDS_FLY,
  BIRD_HIT,
  START,
}

type PeerEventArray<T = unknown> = [
  /**ack needed? */
  0 | 1,
  /** event type */
  PeerEventType,
  /** data */
  T?
];

type PeerEventListener<T> = (e: T) => void;

class PeerEvent<T = unknown> {
  ack: 0 | 1;
  type: PeerEventType;
  data?: T;
  constructor(...args: PeerEventArray<T>) {
    this.ack = args[0];
    this.type = args[1];
    this.data = args[2];
  }

  toArray = () => {
    const arr: PeerEventArray<T> = [this.ack, this.type];
    if (this.data != null) arr[2] = this.data;
    return arr;
  };

  static fromArray = <T>(arr: PeerEventArray<T>) => new PeerEvent(...arr);
}

export enum PeerRequestType {
  TEST,
}
type PeerRequestArray<T = unknown> = [
  /**ack needed? */
  0 | 1,
  /** request type */
  PeerRequestType,
  /** data */
  T?
];
type PeerRequestListener<T> = (reqData: T) => any;

class PeerRequest<T = unknown> {
  ack: 0 | 1;
  type: PeerRequestType;
  data?: T;
  constructor(...args: PeerRequestArray<T>) {
    this.ack = args[0];
    this.type = args[1];
    this.data = args[2];
  }

  toArray = () => {
    const arr: PeerRequestArray<T> = [this.ack, this.type];
    if (this.data != null) arr[2] = this.data;
    return arr;
  };

  static fromArray = <T>(arr: PeerRequestArray<T>) => new PeerRequest(...arr);
}

export class PeerConnection extends WebRTC {
  pendingACKs = new Map<number, number>();
  ackCallbacks = new Map<number, CallableFunction>();
  peerEventListeners = new Map<PeerEventType, Set<PeerEventListener<any>>>();
  peerRequestListeners = new Map<
    PeerRequestType,
    Set<PeerRequestListener<any>>
  >();
  peerResponseListeners = new Map<number, (res: PeerData) => void>();

  constructor(signallingConnection: Connection) {
    super(signallingConnection);
    super.ondata = this.handleIncomingData;
  }

  addPeerEventListener = <T>(type: PeerEventType, cb: PeerEventListener<T>) => {
    if (!this.peerEventListeners.has(type))
      this.peerEventListeners.set(type, new Set());
    this.peerEventListeners.get(type)?.add(cb);
  };

  addPeerRequestListener = <T>(
    type: PeerRequestType,
    cb: PeerRequestListener<T>
  ) => {
    if (!this.peerRequestListeners.has(type))
      this.peerRequestListeners.set(type, new Set());
    this.peerRequestListeners.get(type)?.add(cb);
  };

  emit<T>(
    type: PeerEventType,
    data?: T,
    withAck = false,
    ackCallback?: CallableFunction
  ) {
    const id = Random.int(999999, 100000);
    const d = new PeerData(
      PeerDataType.EVENT,
      id,
      new PeerEvent(withAck ? 1 : 0, type, data).toArray()
    );

    this.send(d);

    if (withAck) {
      const timerID = window.setInterval(() => {
        this.send(d);
      }, 10000);
      this.pendingACKs.set(id, timerID);
      if (ackCallback) {
        this.ackCallbacks.set(id, ackCallback);
      }
    }
  }

  handleIncomingData = (data: any) => {
    if (data instanceof Array) {
      const peerData = PeerData.fromArray(data as PeerDataArray);

      if (peerData.type === PeerDataType.ACK) {
        window.clearInterval(this.pendingACKs.get(peerData.id));
        this.pendingACKs.delete(peerData.id);
        if (this.ackCallbacks.has(peerData.id)) {
          this.ackCallbacks.get(peerData.id)?.();
          this.ackCallbacks.delete(peerData.id);
        }
      } else {
        if (peerData.data) {
          switch (peerData.type) {
            case PeerDataType.EVENT:
              {
                const event = PeerEvent.fromArray(
                  peerData.data as PeerEventArray
                );
                this.peerEventListeners.get(event.type)?.forEach((cb) => {
                  cb(event.data);
                });
              }
              break;
            case PeerDataType.REQUEST:
              {
                const request = PeerRequest.fromArray(
                  peerData.data as PeerRequestArray
                );
                this.peerRequestListeners
                  .get(request.type)
                  ?.forEach((listener) => {
                    const response = new PeerRequest(
                      0,
                      request.type,
                      listener(request)
                    );
                    this.send(
                      new PeerData(
                        PeerDataType.RESPONSE,
                        peerData.id,
                        response.toArray()
                      )
                    );
                  });
              }
              break;
            case PeerDataType.RESPONSE:
              {
                this.peerResponseListeners.get(peerData.id)?.(peerData);
              }
              break;
          }

          if (peerData.data[0] === 1) {
            this.sendAck(peerData.id);
          }
        }
      }
    }
  };

  removePeerEventListener = (
    type: PeerEventType,
    cb: PeerEventListener<unknown>
  ) => {
    this.peerEventListeners.get(type)?.delete(cb);
  };

  removePeerRequestListener = (
    type: PeerRequestType,
    cb: PeerRequestListener<any>
  ) => {
    this.peerRequestListeners.get(type)?.delete(cb);
  };

  request = <ReqData, ResData>(
    type: PeerRequestType,
    data?: ReqData,
    withAck = false
  ) => {
    let isPending = true;
    return new Promise<ResData>((resolve, reject) => {
      try {
        if (this.oDataChannel.readyState !== "open")
          throw new Error(
            "outgoing data channel is:" + this.oDataChannel.readyState
          );
        const timeoutID = setTimeout(() => {
          if (isPending) new Error("Request Timed Out");
        }, 30000);

        const req = new PeerData(
          PeerDataType.REQUEST,
          Random.int(999999, 100000),
          new PeerRequest(withAck ? 1 : 0, type, data).toArray()
        );
        this.send(req);
        const cb = (response: PeerData) => {
          if (response.data) {
            const res = PeerRequest.fromArray<ResData>(
              response.data as PeerRequestArray<ResData>
            );
            resolve(res.data as ResData);
          } else {
            reject(response);
          }
          window.clearTimeout(timeoutID);
          isPending = false;
          this.peerResponseListeners.delete(req.id);
        };
        this.peerResponseListeners.set(req.id, cb);
      } catch (e) {
        isPending = false;
        reject(e);
      }
    });
  };

  private send = (data: PeerData) => {
    this.oDataChannel.send(JSON.stringify(data.toArray()));
  };

  private sendAck = (id: number) => {
    this.send(new PeerData(PeerDataType.ACK, id));
  };
}
