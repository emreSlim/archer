import { IO, RequestPayload } from "archerman-common";
import { getUID } from "./getUID";

// const ENDPOINT = "ws://192.168.0.102:4321";

const ENDPOINT = "wss://archerman-server.onrender.com/:10000";

export class Connection extends IO<WebSocket> {
  constructor() {
    super(new WebSocket(ENDPOINT));
  }
  static isValidRoomID(id: string) {
    id += "";
    return id.length === 4 && !/[^A-Z]/.test(id);
  }
  connect() {
    return new Promise((resolve, reject) => {
      try {
        const cb = () => {
          const payload = new RequestPayload("initialize");
          payload.data = getUID();
          this.request(payload).then(resolve).catch(reject);
        };
        if (this.ws.readyState === 1) {
          cb();
        } else {
          this.ws.onopen = cb;
        }
      } catch (e) {
        reject(e);
      }
    });
  }
  disconnect = () => {
    (this.ws as WebSocket).close();
  };
}
