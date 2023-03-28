import { Connection, EventPayload, RequestPayload } from "./";
import { getUID } from "./getUID";

export async function createRoom(connection: Connection) {
  try {
    const res = await connection.request(new RequestPayload("create.room"));
    return res.data as string;
  } catch (e) {
    console.error(e);
  }
}

export async function leaveRoom(connection: Connection) {
  try {
    connection.emit(new EventPayload("exit.room"));
  } catch (e) {
    console.error(e);
  }
}
