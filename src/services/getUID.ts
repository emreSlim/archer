import { Random } from "../helpers";

export function getUID() {
  const uidKey = "archerman-uid-key";

  let UID = window.localStorage.getItem(uidKey);

  if (!UID) {
    UID = Random.string(16, 0, 127);
    window.localStorage.setItem(uidKey, UID);
  }
  return UID;
}
