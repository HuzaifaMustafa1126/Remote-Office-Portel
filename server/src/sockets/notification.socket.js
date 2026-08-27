import { Server } from "socket.io";
import pool from "../config/database.js";
import env from "../config/env.js";
import { verifyToken } from "../utils/jwt.js";

let io;

export function initializeNotifications(server) {
  io = new Server(server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    transports: ["websocket", "polling"],
  });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = verifyToken(token);
      const [[user]] = await pool.execute(
        "SELECT id,status FROM users WHERE id=? LIMIT 1",
        [decoded.sub],
      );
      if (!user || user.status !== "ACTIVE") return next(new Error("Account unavailable"));
      const [roles] = await pool.execute(
        "SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id=r.id WHERE ur.user_id=?",
        [user.id],
      );
      socket.data.userId = user.id;
      socket.data.roles = roles.map((row) => row.name);
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });
  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
    for (const role of socket.data.roles) socket.join(`role:${role}`);
  });
  return io;
}

export function emitNotification(notification) {
  io?.to(`user:${notification.userId}`).emit("notification:new", notification);
}
