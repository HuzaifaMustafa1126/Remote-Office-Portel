import app from "./app.js";
import env from "./config/env.js";
import { verifyDatabase } from "./config/database.js";
import { createServer } from "node:http";
import { initializeNotifications } from "./sockets/notification.socket.js";
async function start() {
  try {
    await verifyDatabase();
    const server = createServer(app);
    initializeNotifications(server);
    server.listen(env.PORT, () =>
      console.log(`API listening on http://localhost:${env.PORT}`),
    );
  } catch (e) {
    console.error("Unable to connect to MySQL:", e.message);
    process.exit(1);
  }
}
start();
