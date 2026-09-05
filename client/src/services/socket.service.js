import { getDeviceType } from "../utils/device";
import { io } from "socket.io-client";
let socket;
const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1").replace(
    /\/api\/v1\/?$/,
    "",
  );
export function connectNotifications(token) {
  if (socket) socket.disconnect();
  socket = io(socketUrl, {
    auth: { token, deviceType: getDeviceType() },
    autoConnect: true,
    reconnection: true,
  });
  socket.on("connect_error", (error) => {
    if (error.data?.code === "MOBILE_ACCESS_DENIED") {
      socket.disconnect();
      window.dispatchEvent(new CustomEvent("device:denied"));
    }
  });
  return socket;
}
export function disconnectNotifications() {
  socket?.disconnect();
  socket = undefined;
}
