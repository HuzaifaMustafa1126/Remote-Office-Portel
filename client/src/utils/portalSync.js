const channelName = "remote-office-portal-sync";
const storageKey = "remote-office.portal-sync";
const localEvent = "portal:state-changed";
let channel;

function getChannel() {
  if (channel !== undefined) return channel;
  channel =
    typeof BroadcastChannel === "function"
      ? new BroadcastChannel(channelName)
      : null;
  return channel;
}

export function publishPortalStateChanged(
  type,
  { includeCurrent = false } = {},
) {
  const event = { type, at: Date.now() };
  getChannel()?.postMessage(event);
  if (!getChannel()) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(event));
      localStorage.removeItem(storageKey);
    } catch {}
  }
  if (includeCurrent)
    window.dispatchEvent(new CustomEvent(localEvent, { detail: event }));
}

export function subscribePortalStateChanged(callback) {
  const currentChannel = getChannel();
  const message = (event) => callback(event.data);
  const storage = (event) => {
    if (event.key !== storageKey || !event.newValue) return;
    try {
      callback(JSON.parse(event.newValue));
    } catch {}
  };
  const local = (event) => callback(event.detail);
  currentChannel?.addEventListener("message", message);
  window.addEventListener("storage", storage);
  window.addEventListener(localEvent, local);
  return () => {
    currentChannel?.removeEventListener("message", message);
    window.removeEventListener("storage", storage);
    window.removeEventListener(localEvent, local);
  };
}
