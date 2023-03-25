import { Connection, RequestPayload } from "./";

export async function joinRoom(connection: Connection, roomid: string) {
  try {
    const payload = new RequestPayload("join.room");
    payload.data = roomid;
    await connection.request(payload);
    return true;
  } catch (e) {
    console.error(e);
  }
}
