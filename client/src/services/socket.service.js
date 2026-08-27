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
    auth: { token },
    autoConnect: true,
    reconnection: true,
  });
  return socket;
}
export function disconnectNotifications() {
  socket?.disconnect();
  socket = undefined;
}
