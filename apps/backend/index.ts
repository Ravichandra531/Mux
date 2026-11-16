import { mongoose } from "db/client";
import { UserManager } from "./UserManager";

const uri = process.env.DB_URL || process.env.db_url;
if (!uri) {
  throw new Error("Set DB_URL to a MongoDB connection string.");
}
await mongoose.connect(uri);
const manager = new UserManager();
const port = Number(process.env.PORT || 3001);
Bun.serve<{ id: string }>({
  port,
  hostname: "127.0.0.1",
  fetch(request, server) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (
      url.pathname === "/ws" &&
      (!origin ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) &&
      server.upgrade(request, { data: { id: crypto.randomUUID() } })
    ) {
      return;
    }
    return new Response("Mux WebSocket server", {
      status: url.pathname === "/ws" ? 403 : 200,
    });
  },
  websocket: {
    open: (socket) => {
      void manager.open(socket);
    },
    message: (socket, message) => {
      void manager.message(socket, message.toString());
    },
    close: (socket) => manager.close(socket),
  },
});
console.log(`Mux backend listening on 127.0.0.1:${port}`);
